package com.access.control.services;

import com.access.control.dto.EmpleadoDto;
import com.access.control.model.Empleado;
import com.access.control.repository.EmpleadoRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class EmpleadosServiceImpl implements EmpleadosService {

    @Inject
    EmpleadoRepository empleadoRepository;

    @Inject
    com.access.control.repository.GerenciaRepository gerenciaRepository;

    @Inject
    com.access.control.repository.SedeRepository sedeRepository;

    @Inject
    com.access.control.repository.TipoContratoRepository tipoContratoRepository;

    @Inject
    com.access.control.repository.PisoRepository pisoRepository;

    @Inject
    com.access.control.repository.BiometriaVectorRepository biometriaVectorRepository;

    @Inject
    com.access.control.services.UsuarioService usuarioService;

    @Override
    public Empleado getEmpleadoById(Long id) {
        return empleadoRepository.findById(id);
    }

    @Override
    public List<Empleado> getListEmpleados(boolean activeOnly) {
        return empleadoRepository.listAll();
    }

    @Override
    @Transactional
    public Empleado addEmpleado(EmpleadoDto dto) {
        Empleado e = new Empleado();
        e.setName(dto.getNombre());
        e.setLastName(dto.getApellido());
        e.setEmail(dto.getEmail());
        e.setDocumento(dto.getDocumento());
        e.setTelephone(dto.getTelefono());
        e.setCodigoInsignia(dto.getCodigoInsignia());
        e.setSex(dto.getSexo());
        e.setBirthDate(dto.getFechaNacimiento());
        if (dto.getFoto() != null) {
            e.setFoto(dto.getFoto());
        }
        if (dto.getFaceVector() != null) {
            e.setFaceVector(dto.getFaceVector());
        }
        if (dto.getHuella1() != null) {
            e.setHuella1(dto.getHuella1());
        }
        if (dto.getHuella2() != null) {
            e.setHuella2(dto.getHuella2());
        }
        if (dto.getGerenciaId() != null) {
            e.setGerencia(gerenciaRepository.findById(dto.getGerenciaId()));
        }
        if (dto.getSedeId() != null) {
            e.setSede(sedeRepository.findById(dto.getSedeId()));
        }
        if (dto.getTipoContratoId() != null) {
            e.setTipoContrato(tipoContratoRepository.findById(dto.getTipoContratoId()));
        }
        if (dto.getPisoIds() != null && !dto.getPisoIds().isEmpty()) {
            List<com.access.control.model.Piso> pisos = pisoRepository.list("id in ?1", dto.getPisoIds());
            e.setPisosPermitidos(pisos);
        }

        if (dto.getEmail() != null && !dto.getEmail().trim().isEmpty() && usuarioService != null) {
            String nombreCompleto = ((dto.getNombre() != null ? dto.getNombre() : "") + " " +
                    (dto.getApellido() != null ? dto.getApellido() : "")).trim();
            com.access.control.model.User user = usuarioService.obtenerOCrearUsuarioAutomatico(
                    dto.getEmail(), nombreCompleto, e.getSede(), "ROLE_RECEPCION");
            if (user != null) {
                e.setUser(user);
            }
        }

        empleadoRepository.persist(e);
        if (dto.getFaceVector() != null) {
            biometriaVectorRepository.updateFaceEmbeddingFromString("empleados", e.getId(), dto.getFaceVector());
        }
        return e;
    }

    @Override
    @Transactional
    public Empleado updateEmpleado(EmpleadoDto dto, Long id) {
        Empleado e = empleadoRepository.findById(id);
        if (e != null) {
            e.setName(dto.getNombre());
            e.setLastName(dto.getApellido());
            e.setEmail(dto.getEmail());
            e.setTelephone(dto.getTelefono());
            if (dto.getDocumento() != null) {
                e.setDocumento(dto.getDocumento());
            }
            if (dto.getCodigoInsignia() != null) {
                e.setCodigoInsignia(dto.getCodigoInsignia());
            }
            if (dto.getSexo() != null) {
                e.setSex(dto.getSexo());
            }
            if (dto.getFechaNacimiento() != null) {
                e.setBirthDate(dto.getFechaNacimiento());
            }
            if (dto.getFoto() != null) {
                e.setFoto(dto.getFoto());
            }
            if (dto.getFaceVector() != null) {
                e.setFaceVector(dto.getFaceVector());
                biometriaVectorRepository.updateFaceEmbeddingFromString("empleados", e.getId(), dto.getFaceVector());
            }
            if (dto.getHuella1() != null) {
                e.setHuella1(dto.getHuella1());
            }
            if (dto.getHuella2() != null) {
                e.setHuella2(dto.getHuella2());
            }
            if (dto.getGerenciaId() != null) {
                e.setGerencia(gerenciaRepository.findById(dto.getGerenciaId()));
            }
            if (dto.getSedeId() != null) {
                e.setSede(sedeRepository.findById(dto.getSedeId()));
            }
            if (dto.getTipoContratoId() != null) {
                e.setTipoContrato(tipoContratoRepository.findById(dto.getTipoContratoId()));
            }
            if (dto.getPisoIds() != null) {
                if (dto.getPisoIds().isEmpty()) {
                    e.setPisosPermitidos(new java.util.ArrayList<>());
                } else {
                    List<com.access.control.model.Piso> pisos = pisoRepository.list("id in ?1", dto.getPisoIds());
                    e.setPisosPermitidos(pisos);
                }
            }
        }
        return e;
    }

    @Override
    @Transactional
    public Empleado updateEmpleadoHuella(Empleado empleado, Long id) {
        Empleado e = empleadoRepository.findById(id);
        if (e != null) {
            e.setHuella1(empleado.getHuella1());
            e.setHuella2(empleado.getHuella2());
        }
        return e;
    }

    @Override
    @Transactional
    public Empleado updatePisos(EmpleadoDto dto, Long id) {
        Empleado e = empleadoRepository.findById(id);
        if (e != null && dto.getPisoIds() != null) {
            if (dto.getPisoIds().isEmpty()) {
                e.setPisosPermitidos(new java.util.ArrayList<>());
            } else {
                List<com.access.control.model.Piso> pisos = pisoRepository.list("id in ?1", dto.getPisoIds());
                e.setPisosPermitidos(pisos);
            }
        }
        return e;
    }

    @Override
    @Transactional
    public boolean deleteEmpleado(Empleado empleado) {
        if (empleado != null && empleado.getId() != null) {
            return empleadoRepository.deleteById(empleado.getId());
        }
        return false;
    }
}
