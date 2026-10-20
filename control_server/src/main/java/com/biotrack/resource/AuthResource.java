package com.biotrack.resource;

import com.access.control.model.Authority;
import com.access.control.model.SesionActiva;
import com.access.control.model.User;
import com.access.control.repository.SesionActivaRepository;
import com.access.control.repository.UserRepository;
import com.access.control.services.UsuarioService;
import com.biotrack.entity.TelemetriaVitalEntity;
import com.biotrack.entity.UsuarioEntity;
import com.biotrack.repository.TelemetriaVitalRepository;
import com.biotrack.repository.UsuarioRepository;
import io.smallrye.jwt.build.Jwt;
import io.smallrye.common.annotation.NonBlocking;
import io.smallrye.mutiny.Uni;
import io.smallrye.mutiny.infrastructure.Infrastructure;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.bson.types.ObjectId;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.mindrot.jbcrypt.BCrypt;

import java.time.Duration;
import java.util.*;

@Path("/api/v1/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    UsuarioRepository usuarioRepository;

    @Inject
    TelemetriaVitalRepository telemetriaVitalRepository;

    @Inject
    JsonWebToken jwt;

    @Inject
    UserRepository postgresUserRepository;

    @Inject
    UsuarioService usuarioService;

    @Inject
    SesionActivaRepository sesionActivaRepository;

    @Inject
    com.access.control.repository.ClienteRepository clienteRepository;

    private String extraerIpCliente(HttpHeaders headers) {
        if (headers == null) return "127.0.0.1";
        String xForwardedFor = headers.getHeaderString("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.trim().isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = headers.getHeaderString("X-Real-IP");
        if (xRealIp != null && !xRealIp.trim().isEmpty()) {
            return xRealIp.trim();
        }
        return "127.0.0.1";
    }

    // --- DTOs ---
    public static class RegistroRequest {
        public String correo;
        public String rol;
        public String tipoMembresia;
        public String estadoPago;
        public String idPulseraAsignada;
    }

    public static class LoginRequest {
        public String correo;
        public String username;
        public String password;
    }

    public static class CambiarClaveRequest {
        public String correo;
        public String username;
        public String claveActual;
        public String nuevaClave;
        public String confirmacionClave;
    }

    public static class RegistroFotogramaRequest {
        public String correo;
        public String clave;
        public String fotogramaBase64;
        public String idPulseraAsignada;
        public String tipoMembresia;
    }

    @POST
    @Path("/registro")
    @NonBlocking
    public Uni<Response> registrar(RegistroRequest request) {
        return Uni.createFrom().item(() -> {
            if (request == null || request.correo == null || request.correo.trim().isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "El correo electronico es obligatorio."))
                        .build();
            }

            UsuarioEntity existente = usuarioRepository.findByCorreo(request.correo.trim());
            if (existente != null) {
                return Response.status(Response.Status.CONFLICT)
                        .entity(Map.of("error", "El usuario ya existe en el sistema."))
                        .build();
            }

            UsuarioEntity usuario = new UsuarioEntity();
            usuario.correo = request.correo.trim().toLowerCase();
            usuario.claveEncriptada = BCrypt.hashpw("123456", BCrypt.gensalt(10));
            usuario.rol = (request.rol != null && !request.rol.trim().isEmpty()) ? request.rol.toUpperCase() : "CLIENTE";
            usuario.primerIngreso = true;
            usuario.tipoMembresia = (request.tipoMembresia != null) ? request.tipoMembresia : "ESTANDAR";
            usuario.estadoPago = (request.estadoPago != null) ? request.estadoPago : "PENDIENTE";
            usuario.idPulseraAsignada = request.idPulseraAsignada;

            usuarioRepository.persist(usuario);

            return Response.status(Response.Status.CREATED).entity(Map.of(
                    "mensaje", "Usuario registrado exitosamente con clave generica.",
                    "correo", usuario.correo,
                    "primerIngreso", usuario.primerIngreso,
                    "rol", usuario.rol
            )).build();
        }).runSubscriptionOn(Infrastructure.getDefaultWorkerPool());
    }

    @POST
    @Path("/login")
    @NonBlocking
    public Uni<Response> login(LoginRequest request, @Context HttpHeaders headers) {
        return Uni.createFrom().item(() -> {
            String loginUser = null;
            if (request != null) {
                if (request.username != null && !request.username.trim().isEmpty()) {
                    loginUser = request.username.trim().toLowerCase();
                } else if (request.correo != null && !request.correo.trim().isEmpty()) {
                    loginUser = request.correo.trim().toLowerCase();
                }
            }

            if (loginUser == null || request.password == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "Usuario/correo y contrasena son obligatorios."))
                        .build();
            }

            String userAgent = headers != null ? headers.getHeaderString("User-Agent") : "WEB";
            String ip = extraerIpCliente(headers);

            // 1. Intentar autenticar contra PostgreSQL 'users'
            User pgUser = postgresUserRepository.findByUsername(loginUser);
            if (pgUser != null) {
                if (Boolean.FALSE.equals(pgUser.getEnabled())) {
                    usuarioService.registrarAuditoria(pgUser.getUsername(), pgUser.getId(),
                            pgUser.getSede() != null ? pgUser.getSede().getId() : null,
                            pgUser.getSede() != null ? pgUser.getSede().getSede() : null,
                            ip, userAgent, "LOGIN", "DENEGADO", "Usuario inactivo en el sistema");

                    return Response.status(Response.Status.FORBIDDEN)
                            .entity(Map.of("error", "El usuario esta inactivo. Contacte al administrador."))
                            .build();
                }

                boolean match = false;
                try {
                    match = BCrypt.checkpw(request.password, pgUser.getPassword());
                } catch (Exception e) {
                    match = request.password.equals(pgUser.getPassword());
                }

                if (!match) {
                    usuarioService.registrarAuditoria(pgUser.getUsername(), pgUser.getId(),
                            pgUser.getSede() != null ? pgUser.getSede().getId() : null,
                            pgUser.getSede() != null ? pgUser.getSede().getSede() : null,
                            ip, userAgent, "LOGIN", "FALLIDO", "Credenciales invalidas");

                    return Response.status(Response.Status.UNAUTHORIZED)
                            .entity(Map.of("error", "Credenciales invalidas."))
                            .build();
                }

                // Detectar si requiere reseteo o cambio obligatorio de clave
                if (Boolean.TRUE.equals(pgUser.getRequiresPasswordReset())) {
                    return Response.ok(Map.of(
                            "requiresPasswordReset", true,
                            "requiereCambioClave", true,
                            "mensaje", "Debe cambiar su clave antes de continuar.",
                            "username", pgUser.getUsername(),
                            "correo", pgUser.getEmail() != null ? pgUser.getEmail() : pgUser.getUsername()
                    )).build();
                }

                // Detectar si el usuario corresponde a un Cliente (App movil / Portal Web Cliente)
                com.access.control.model.Cliente clienteAsociado = clienteRepository.find("user.id", pgUser.getId()).firstResult();
                if (clienteAsociado == null && pgUser.getEmail() != null) {
                    clienteAsociado = clienteRepository.findByEmail(pgUser.getEmail());
                }
                if (clienteAsociado == null && pgUser.getUsername() != null) {
                    clienteAsociado = clienteRepository.findByEmail(pgUser.getUsername());
                }

                // Obtener rol principal
                String principalRole = "ROLE_EMPLEADO";
                Set<String> rolesList = new HashSet<>();
                if (pgUser.getAuthorities() != null && !pgUser.getAuthorities().isEmpty()) {
                    for (Authority a : pgUser.getAuthorities()) {
                        rolesList.add(a.getName());
                    }
                    if (pgUser.isAdminOrSuperAdmin()) {
                        principalRole = "ROLE_ADMIN";
                    } else {
                        principalRole = pgUser.getAuthorities().iterator().next().getName();
                    }
                } else {
                    if (clienteAsociado != null) {
                        principalRole = "ROLE_CLIENTE";
                    }
                    rolesList.add(principalRole);
                }

                if (clienteAsociado != null) {
                    rolesList.add("ROLE_CLIENTE");
                    if (!pgUser.isAdminOrSuperAdmin()) {
                        principalRole = "ROLE_CLIENTE";
                    }
                }

                // Token SmallRye JWT
                String token = Jwt.issuer("https://controlacceso.api/issuer")
                        .upn(pgUser.getUsername())
                        .subject(pgUser.getId() != null ? pgUser.getId().toString() : pgUser.getUsername())
                        .groups(rolesList)
                        .claim("username", pgUser.getUsername())
                        .claim("email", pgUser.getEmail() != null ? pgUser.getEmail() : "")
                        .expiresIn(Duration.ofHours(24))
                        .sign();

                // Actualizar ultimo login, sesion activa y auditoria mediante servicio transaccional
                usuarioService.registrarSesionActiva(pgUser.getId(), pgUser.getUsername(), ip, userAgent,
                        pgUser.getSede() != null ? pgUser.getSede().getId() : null,
                        pgUser.getSede() != null ? pgUser.getSede().getSede() : null);

                usuarioService.registrarAuditoria(pgUser.getUsername(), pgUser.getId(),
                        pgUser.getSede() != null ? pgUser.getSede().getId() : null,
                        pgUser.getSede() != null ? pgUser.getSede().getSede() : null,
                        ip, userAgent, "LOGIN", "EXITO", "Inicio de sesion exitoso");

                Map<String, Object> resp = new HashMap<>();
                resp.put("primerIngreso", false);
                resp.put("requiresPasswordReset", false);
                resp.put("token", token);
                resp.put("username", pgUser.getUsername());
                resp.put("role", principalRole);
                resp.put("roles", rolesList);
                resp.put("nombreCompleto", pgUser.getNombreCompleto() != null ? pgUser.getNombreCompleto() : pgUser.getUsername());
                resp.put("sedeId", pgUser.getSede() != null ? pgUser.getSede().getId() : null);
                resp.put("sedeNombre", pgUser.getSede() != null ? pgUser.getSede().getSede() : null);

                if (clienteAsociado != null) {
                    resp.put("clienteId", clienteAsociado.getId());
                    resp.put("documento", clienteAsociado.getDocumento());
                    resp.put("estadoSuscripcion", clienteAsociado.getEstadoSuscripcion());
                    resp.put("qrToken", clienteAsociado.getQrTokenDinamico());
                    resp.put("membresiaNombre", clienteAsociado.getMembresiaActual() != null ? clienteAsociado.getMembresiaActual().getNombre() : null);
                    resp.put("sesionMovilActiva", clienteAsociado.getSesionMovilActiva());
                }

                return Response.ok(resp).build();
            }

            // 2. Fallback de contingencia contra MongoDB 'UsuarioEntity'
            UsuarioEntity usuario = usuarioRepository.findByCorreo(loginUser);
            if (usuario == null) {
                usuarioService.registrarAuditoria(loginUser, null, null, null,
                        ip, userAgent, "LOGIN", "FALLIDO", "Usuario no existe");

                return Response.status(Response.Status.UNAUTHORIZED)
                        .entity(Map.of("error", "Credenciales invalidas."))
                        .build();
            }

            boolean passwordMatch = false;
            try {
                passwordMatch = BCrypt.checkpw(request.password, usuario.claveEncriptada);
            } catch (Exception e) {
                passwordMatch = request.password.equals(usuario.claveEncriptada);
            }

            if (!passwordMatch) {
                usuarioService.registrarAuditoria(usuario.correo, null, null, null,
                        ip, userAgent, "LOGIN", "FALLIDO", "Contrasena incorrecta");

                return Response.status(Response.Status.UNAUTHORIZED)
                        .entity(Map.of("error", "Credenciales invalidas."))
                        .build();
            }

            // Validacion de primer ingreso
            if (usuario.primerIngreso) {
                return Response.ok(Map.of(
                        "primerIngreso", true,
                        "requiereCambioClave", true,
                        "mensaje", "Debe cambiar su clave en el primer ingreso antes de continuar.",
                        "correo", usuario.correo,
                        "username", usuario.correo,
                        "rol", usuario.rol != null ? usuario.rol : "CLIENTE"
                )).build();
            }

            // Emision de Token JWT SmallRye
            String token = Jwt.issuer("https://controlacceso.api/issuer")
                    .upn(usuario.correo)
                    .subject(usuario.id != null ? usuario.id.toString() : usuario.correo)
                    .groups(new HashSet<>(Collections.singletonList(usuario.rol != null ? usuario.rol : "CLIENTE")))
                    .claim("correo", usuario.correo)
                    .claim("idPulseraAsignada", usuario.idPulseraAsignada != null ? usuario.idPulseraAsignada : "")
                    .claim("tipoMembresia", usuario.tipoMembresia != null ? usuario.tipoMembresia : "")
                    .expiresIn(Duration.ofHours(24))
                    .sign();

            usuarioService.registrarAuditoria(usuario.correo, null, null, null,
                    ip, userAgent, "LOGIN", "EXITO", "Inicio de sesion MongoDB exitoso");

            Long resolvedClienteId = null;
            if (clienteRepository != null) {
                com.access.control.model.Cliente c = clienteRepository.findByEmail(usuario.correo);
                if (c == null) {
                    c = clienteRepository.findPrimerCliente();
                }
                if (c != null) {
                    resolvedClienteId = c.getId();
                }
            }

            Map<String, Object> respMap = new HashMap<>();
            respMap.put("primerIngreso", false);
            respMap.put("requiresPasswordReset", false);
            respMap.put("token", token);
            respMap.put("username", usuario.correo);
            respMap.put("correo", usuario.correo);
            respMap.put("role", usuario.rol != null ? usuario.rol : "CLIENTE");
            respMap.put("idPulseraAsignada", usuario.idPulseraAsignada != null ? usuario.idPulseraAsignada : "");
            respMap.put("tipoMembresia", usuario.tipoMembresia != null ? usuario.tipoMembresia : "");
            respMap.put("estadoPago", usuario.estadoPago != null ? usuario.estadoPago : "");
            if (resolvedClienteId != null) {
                respMap.put("clienteId", resolvedClienteId);
            }

            return Response.ok(respMap).build();
        }).runSubscriptionOn(Infrastructure.getDefaultWorkerPool());
    }

    @POST
    @Path("/cambiar-clave")
    @NonBlocking
    public Uni<Response> cambiarClave(CambiarClaveRequest request) {
        return Uni.createFrom().item(() -> {
            String targetUser = request != null && request.username != null ? request.username.trim().toLowerCase()
                    : (request != null && request.correo != null ? request.correo.trim().toLowerCase() : null);

            if (targetUser == null || request.nuevaClave == null || request.confirmacionClave == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "Usuario y nueva clave son obligatorios."))
                        .build();
            }

            if (!request.nuevaClave.equals(request.confirmacionClave)) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "La nueva clave y su confirmacion no coinciden."))
                        .build();
            }

            if (request.nuevaClave.length() < 6) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "La nueva clave debe tener al menos 6 caracteres."))
                        .build();
            }

            // 1. Probar en PostgreSQL 'User'
            User pgUser = postgresUserRepository.findByUsername(targetUser);
            if (pgUser != null) {
                boolean cambiado = usuarioService.cambiarPassword(targetUser, request.claveActual != null ? request.claveActual : "", request.nuevaClave);
                if (cambiado) {
                    return Response.ok(Map.of(
                            "mensaje", "Clave actualizada con exito. Ahora puede iniciar sesion.",
                            "requiresPasswordReset", false,
                            "username", pgUser.getUsername()
                    )).build();
                }
            }

            // 2. Fallback MongoDB 'UsuarioEntity'
            UsuarioEntity usuario = usuarioRepository.findByCorreo(targetUser);
            if (usuario == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Usuario no encontrado."))
                        .build();
            }

            usuario.claveEncriptada = BCrypt.hashpw(request.nuevaClave, BCrypt.gensalt(10));
            usuario.primerIngreso = false;
            usuarioRepository.update(usuario);

            return Response.ok(Map.of(
                    "mensaje", "Clave actualizada con exito. Ahora puede iniciar sesion.",
                    "primerIngreso", false,
                    "correo", usuario.correo
            )).build();
        }).runSubscriptionOn(Infrastructure.getDefaultWorkerPool());
    }

    @POST
    @Path("/registrar-fotograma")
    @NonBlocking
    public Uni<Response> registrarFotograma(RegistroFotogramaRequest request) {
        return Uni.createFrom().item(() -> {
            if (request == null || request.correo == null || request.clave == null || request.fotogramaBase64 == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "Correo, clave y fotograma son obligatorios."))
                        .build();
            }

            UsuarioEntity usuario = usuarioRepository.findByCorreo(request.correo.trim().toLowerCase());
            if (usuario == null) {
                usuario = new UsuarioEntity();
                usuario.correo = request.correo.trim().toLowerCase();
                usuario.rol = "CLIENTE";
                usuario.primerIngreso = false;
                usuario.tipoMembresia = (request.tipoMembresia != null) ? request.tipoMembresia : "ESTANDAR";
                usuario.estadoPago = "AL_DIA";
            }

            usuario.claveEncriptada = BCrypt.hashpw(request.clave, BCrypt.gensalt(10));
            usuario.fotogramaBase64 = request.fotogramaBase64;
            if (request.idPulseraAsignada != null && !request.idPulseraAsignada.trim().isEmpty()) {
                usuario.idPulseraAsignada = request.idPulseraAsignada.trim();
            }

            if (usuario.id == null) {
                usuarioRepository.persist(usuario);
            } else {
                usuarioRepository.update(usuario);
            }

            return Response.status(Response.Status.CREATED).entity(Map.of(
                    "mensaje", "Registro autonomo de cliente con fotograma completado exitosamente.",
                    "correo", usuario.correo,
                    "rol", usuario.rol,
                    "idPulseraAsignada", usuario.idPulseraAsignada != null ? usuario.idPulseraAsignada : ""
            )).build();
        }).runSubscriptionOn(Infrastructure.getDefaultWorkerPool());
    }

    @GET
    @Path("/perfil")
    public Response obtenerPerfil() {
        if (jwt == null || jwt.getName() == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        String username = jwt.getName();
        User pgUser = postgresUserRepository.findByUsername(username.toLowerCase());
        if (pgUser != null) {
            return Response.ok(Map.of(
                    "username", pgUser.getUsername(),
                    "email", pgUser.getEmail() != null ? pgUser.getEmail() : "",
                    "nombreCompleto", pgUser.getNombreCompleto() != null ? pgUser.getNombreCompleto() : pgUser.getUsername(),
                    "sedeId", pgUser.getSede() != null ? pgUser.getSede().getId() : "",
                    "sedeNombre", pgUser.getSede() != null ? pgUser.getSede().getSede() : "",
                    "isAdmin", pgUser.isAdminOrSuperAdmin()
            )).build();
        }
        return Response.ok(Map.of("username", username)).build();
    }

    @POST
    @Path("/logout")
    @NonBlocking
    public Uni<Response> logout(@Context HttpHeaders headers) {
        return Uni.createFrom().item(() -> {
            String username = null;
            if (jwt != null && jwt.getName() != null && !jwt.getName().trim().isEmpty()) {
                username = jwt.getName().trim().toLowerCase();
            }
            if (username != null) {
                String ip = extraerIpCliente(headers);
                String userAgent = headers != null ? headers.getHeaderString("User-Agent") : "WEB";
                usuarioService.revocarSesionPorUsername(username, ip, userAgent);
            }
            return Response.ok(Map.of("success", true, "mensaje", "Sesion finalizada con exito.")).build();
        }).runSubscriptionOn(Infrastructure.getDefaultWorkerPool());
    }
}
