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
        e.setNombre(dto.getNombre());
        e.setApellido(dto.getApellido());
        e.setEmail(dto.getEmail());
        e.setDocumento(dto.getDocumento());
        e.setTelefono(dto.getTelefono());
        empleadoRepository.persist(e);
        return e;
    }

    @Override
    @Transactional
    public Empleado updateEmpleado(EmpleadoDto dto, Long id) {
        Empleado e = empleadoRepository.findById(id);
        if (e != null) {
            e.setNombre(dto.getNombre());
            e.setApellido(dto.getApellido());
            e.setEmail(dto.getEmail());
            e.setTelefono(dto.getTelefono());
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
        return empleadoRepository.findById(id);
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
