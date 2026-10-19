package com.access.control.services;

import com.access.control.dto.UserDTO;
import com.access.control.model.AuditoriaAcceso;
import com.access.control.model.Authority;
import com.access.control.model.Sede;
import com.access.control.model.SesionActiva;
import com.access.control.model.User;
import com.access.control.model.Empleado;
import com.access.control.repository.AuditoriaAccesoRepository;
import com.access.control.repository.AuthorityRepository;
import com.access.control.repository.EmpleadoRepository;
import com.access.control.repository.SedeRepository;
import com.access.control.repository.SesionActivaRepository;
import com.access.control.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.mindrot.jbcrypt.BCrypt;

import java.util.*;
import java.util.stream.Collectors;

@ApplicationScoped
public class UsuarioServiceImpl implements UsuarioService {

    @Inject
    UserRepository userRepository;

    @Inject
    EmpleadoRepository empleadoRepository;

    @Inject
    SedeRepository sedeRepository;

    @Inject
    AuthorityRepository authorityRepository;

    @Inject
    AuditoriaAccesoRepository auditoriaRepository;

    @Inject
    SesionActivaRepository sesionActivaRepository;

    @Override
    public List<UserDTO> listarUsuarios() {
        return userRepository.listAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public UserDTO obtenerPorId(Long id) {
        User u = userRepository.findById(id);
        return u != null ? toDTO(u) : null;
    }

    @Override
    @Transactional
    public UserDTO crearUsuario(UserDTO dto) {
        if (dto == null || dto.username == null || dto.username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username es requerido");
        }

        boolean esRolCliente = dto.roles != null && dto.roles.stream()
                .anyMatch(r -> r != null && (r.equalsIgnoreCase("ROLE_CLIENTE") || r.equalsIgnoreCase("CLIENTE")));

        Empleado emp = null;
        if (dto.empleadoId != null) {
            emp = empleadoRepository.findById(dto.empleadoId);
            if (emp == null) {
                throw new IllegalArgumentException("El empleado seleccionado no existe.");
            }
            if (emp.getUser() != null) {
                throw new IllegalArgumentException("El empleado ya tiene un usuario asignado (" + emp.getUser().getUsername() + ").");
            }
        } else if (!esRolCliente) {
            throw new IllegalArgumentException("Es obligatorio asociar el usuario a un empleado sin usuario asignado.");
        }

        User u = new User();
        u.setUsername(dto.username.trim().toLowerCase());
        u.setEmail(dto.email != null ? dto.email.trim().toLowerCase() : null);
        u.setNombreCompleto(dto.nombreCompleto);
        u.setEnabled(dto.enabled != null ? dto.enabled : true);
        u.setRequiresPasswordReset(dto.requiresPasswordReset != null ? dto.requiresPasswordReset : true);

        String rawClave = (dto.password != null && !dto.password.trim().isEmpty())
                ? dto.password.trim() : "123456";
        u.setPassword(BCrypt.hashpw(rawClave, BCrypt.gensalt(10)));

        if (dto.sedeId != null) {
            Sede s = sedeRepository.findById(dto.sedeId);
            u.setSede(s);
        } else if (emp != null && emp.getSede() != null) {
            u.setSede(emp.getSede());
        }

        asignarRoles(u, dto.roles);

        userRepository.persist(u);

        if (emp != null) {
            emp.setUser(u);
            empleadoRepository.persist(emp);
        }

        registrarAuditoria(u.getUsername(), u.getId(),
                u.getSede() != null ? u.getSede().getId() : null,
                u.getSede() != null ? u.getSede().getSede() : null,
                "SYSTEM", "BACKEND", "CREACION_USUARIO", "EXITO",
                emp != null ? "Usuario creado con clave inicial y vinculado a empleado ID: " + emp.getId()
                            : "Usuario creado exitosamente (tipo: " + (esRolCliente ? "CLIENTE" : "GENERAL") + ")");

        UserDTO resDto = toDTO(u);
        if (emp != null) {
            resDto.empleadoId = emp.getId();
        }
        return resDto;
    }

    @Override
    @Transactional
    public UserDTO actualizarUsuario(Long id, UserDTO dto) {
        User u = userRepository.findById(id);
        if (u == null) {
            return null;
        }

        if (dto.email != null) u.setEmail(dto.email.trim().toLowerCase());
        if (dto.nombreCompleto != null) u.setNombreCompleto(dto.nombreCompleto);
        if (dto.enabled != null) u.setEnabled(dto.enabled);
        if (dto.requiresPasswordReset != null) u.setRequiresPasswordReset(dto.requiresPasswordReset);

        if (dto.password != null && !dto.password.trim().isEmpty()) {
            u.setPassword(BCrypt.hashpw(dto.password.trim(), BCrypt.gensalt(10)));
        }

        if (dto.sedeId != null) {
            Sede s = sedeRepository.findById(dto.sedeId);
            u.setSede(s);
        } else {
            u.setSede(null);
        }

        if (dto.roles != null) {
            asignarRoles(u, dto.roles);
        }

        userRepository.persist(u);

        registrarAuditoria(u.getUsername(), u.getId(),
                u.getSede() != null ? u.getSede().getId() : null,
                u.getSede() != null ? u.getSede().getSede() : null,
                "SYSTEM", "BACKEND", "ACTUALIZACION_USUARIO", "EXITO", "Datos de usuario actualizados");

        return toDTO(u);
    }

    @Override
    @Transactional
    public boolean cambiarEstado(Long id, boolean enabled) {
        User u = userRepository.findById(id);
        if (u == null) return false;
        u.setEnabled(enabled);
        userRepository.persist(u);

        if (!enabled) {
            sesionActivaRepository.invalidarPorUsername(u.getUsername());
        }

        registrarAuditoria(u.getUsername(), u.getId(),
                u.getSede() != null ? u.getSede().getId() : null,
                u.getSede() != null ? u.getSede().getSede() : null,
                "SYSTEM", "BACKEND", enabled ? "ACTIVACION_USUARIO" : "INACTIVACION_USUARIO",
                "EXITO", "Estado cambiado a " + (enabled ? "ACTIVO" : "INACTIVO"));

        return true;
    }

    @Override
    @Transactional
    public boolean forzarReseteoPassword(Long id) {
        User u = userRepository.findById(id);
        if (u == null) return false;
        u.setRequiresPasswordReset(true);
        userRepository.persist(u);

        registrarAuditoria(u.getUsername(), u.getId(),
                u.getSede() != null ? u.getSede().getId() : null,
                u.getSede() != null ? u.getSede().getSede() : null,
                "SYSTEM", "BACKEND", "FORZAR_RESETEO_CLAVE", "EXITO", "Usuario marcado para reseteo obligatorio de clave");

        return true;
    }

    @Override
    @Transactional
    public boolean cambiarPassword(String username, String currentPassword, String newPassword) {
        User u = userRepository.findByUsername(username.trim().toLowerCase());
        if (u == null) return false;

        boolean matches = false;
        try {
            matches = BCrypt.checkpw(currentPassword, u.getPassword());
        } catch (Exception e) {
            matches = currentPassword.equals(u.getPassword());
        }

        if (!matches && !u.getRequiresPasswordReset()) {
            return false;
        }

        u.setPassword(BCrypt.hashpw(newPassword, BCrypt.gensalt(10)));
        u.setRequiresPasswordReset(false);
        userRepository.persist(u);

        registrarAuditoria(u.getUsername(), u.getId(),
                u.getSede() != null ? u.getSede().getId() : null,
                u.getSede() != null ? u.getSede().getSede() : null,
                "CLIENT", "WEB", "CAMBIO_CLAVE", "EXITO", "Clave cambiada exitosamente");

        return true;
    }

    @Override
    @Transactional
    public void registrarAuditoria(String username, Long userId, Long sedeId, String sedeNombre,
                                   String ip, String userAgent, String accion, String estado, String detalles) {
        try {
            AuditoriaAcceso audit = new AuditoriaAcceso();
            audit.setUsername(username != null ? username : "DESCONOCIDO");
            audit.setUserId(userId);
            audit.setSedeId(sedeId);
            audit.setSedeNombre(sedeNombre);
            audit.setIpAddress(ip != null ? ip : "127.0.0.1");
            audit.setUserAgent(userAgent);
            audit.setAccion(accion);
            audit.setEstado(estado);
            audit.setDetalles(detalles);
            audit.setFechaHora(new Date());
            auditoriaRepository.persist(audit);
        } catch (Exception e) {
            // No romper flujo por falla en auditoria
        }
    }

    @Override
    @Transactional
    public void registrarSesionActiva(Long userId, String username, String ip, String userAgent, Long sedeId, String sedeNombre) {
        try {
            if (userId != null) {
                User u = userRepository.findById(userId);
                if (u != null) {
                    u.setLastLogin(new Date());
                    userRepository.persist(u);
                }
            }
            SesionActiva sesion = new SesionActiva();
            sesion.setUserId(userId);
            sesion.setUsername(username != null ? username : "DESCONOCIDO");
            sesion.setTokenId(UUID.randomUUID().toString());
            sesion.setIpAddress(ip != null ? ip : "127.0.0.1");
            sesion.setUserAgent(userAgent);
            sesion.setSedeId(sedeId);
            sesion.setSedeNombre(sedeNombre);
            sesion.setFechaInicio(new Date());
            sesion.setUltimaActividad(new Date());
            sesion.setActiva(true);
            sesionActivaRepository.persist(sesion);
        } catch (Exception e) {
            // No romper flujo por falla en sesion
        }
    }

    @Override
    public List<AuditoriaAcceso> listarAuditoria(int limit) {
        return auditoriaRepository.findRecientes(limit > 0 ? limit : 100);
    }

    @Override
    public List<SesionActiva> listarSesionesActivas() {
        return sesionActivaRepository.findActivas();
    }

    @Override
    @Transactional
    public boolean revocarSesion(Long sesionId) {
        SesionActiva s = sesionActivaRepository.findById(sesionId);
        if (s == null) return false;
        s.setActiva(false);
        sesionActivaRepository.persist(s);

        registrarAuditoria(s.getUsername(), s.getUserId(), s.getSedeId(), s.getSedeNombre(),
                s.getIpAddress(), "BACKEND", "REVOCACION_SESION", "EXITO", "Sesion activa revocada por administrador");
        return true;
    }

    @Override
    @Transactional
    public void revocarSesionPorUsername(String username, String ip, String userAgent) {
        if (username == null || username.trim().isEmpty()) return;
        sesionActivaRepository.invalidarPorUsername(username.trim().toLowerCase());
        registrarAuditoria(username, null, null, null,
                ip, userAgent, "LOGOUT", "EXITO", "Cierre voluntario de sesion");
    }

    @Override
    @Transactional
    public User obtenerOCrearUsuarioAutomatico(String email, String nombreCompleto, Sede sede, String rolDefecto) {
        if (email == null || email.trim().isEmpty()) {
            return null;
        }
        String emailNorm = email.trim().toLowerCase();

        // Buscar si ya existe usuario con ese email o username
        User u = userRepository.find("email = ?1 or username = ?1", emailNorm).firstResult();
        if (u != null) {
            return u;
        }

        u = new User();
        u.setUsername(emailNorm);
        u.setEmail(emailNorm);
        u.setNombreCompleto(nombreCompleto != null ? nombreCompleto.trim() : emailNorm);
        u.setEnabled(true);
        u.setRequiresPasswordReset(true);
        u.setPassword(BCrypt.hashpw("123456", BCrypt.gensalt(10)));
        u.setSede(sede);

        Set<String> roles = new HashSet<>();
        if (rolDefecto != null && !rolDefecto.trim().isEmpty()) {
            roles.add(rolDefecto.trim());
        } else {
            roles.add("ROLE_CLIENTE");
        }
        asignarRoles(u, roles);

        userRepository.persist(u);

        registrarAuditoria(u.getUsername(), u.getId(),
                sede != null ? sede.getId() : null,
                sede != null ? sede.getSede() : null,
                "SYSTEM", "BACKEND", "CREACION_USUARIO_AUTO", "EXITO",
                "Usuario creado automaticamente vinculado al correo con clave por defecto y cambio obligatorio");

        return u;
    }

    private void asignarRoles(User u, Set<String> rolesNames) {
        Set<Authority> set = new HashSet<>();
        if (rolesNames != null && !rolesNames.isEmpty()) {
            for (String r : rolesNames) {
                if (r == null || r.trim().isEmpty()) continue;
                String rolNorm = r.trim().toUpperCase();
                if (!rolNorm.startsWith("ROLE_")) {
                    rolNorm = "ROLE_" + rolNorm;
                }
                Authority auth = authorityRepository.findByName(rolNorm);
                if (auth == null) {
                    auth = new Authority();
                    auth.setName(rolNorm);
                    authorityRepository.persist(auth);
                }
                set.add(auth);
            }
        }
        if (set.isEmpty()) {
            Authority auth = authorityRepository.findByName("ROLE_EMPLEADO");
            if (auth == null) {
                auth = new Authority();
                auth.setName("ROLE_EMPLEADO");
                authorityRepository.persist(auth);
            }
            set.add(auth);
        }
        u.setAuthorities(set);
    }

    private UserDTO toDTO(User u) {
        UserDTO d = new UserDTO();
        d.id = u.getId();
        d.username = u.getUsername();
        d.email = u.getEmail();
        d.nombreCompleto = u.getNombreCompleto();
        d.enabled = u.getEnabled();
        d.requiresPasswordReset = u.getRequiresPasswordReset();
        d.lastLogin = u.getLastLogin();
        if (u.getSede() != null) {
            d.sedeId = u.getSede().getId();
            d.sedeNombre = u.getSede().getSede();
        }
        if (u.getAuthorities() != null) {
            d.roles = u.getAuthorities().stream()
                    .map(Authority::getName)
                    .collect(Collectors.toSet());
        } else {
            d.roles = Collections.emptySet();
        }
        return d;
    }
}
