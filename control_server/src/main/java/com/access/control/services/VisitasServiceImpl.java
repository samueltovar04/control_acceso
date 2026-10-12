package com.access.control.services;

import com.access.control.dto.VisitaDto;
import com.access.control.model.Visita;
import com.access.control.repository.VisitaRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class VisitasServiceImpl implements VisitasService {

    @Inject
    VisitaRepository visitaRepository;

    @Override
    public List<Visita> getListVisitas() {
        return visitaRepository.listAll();
    }

    @Override
    public Visita getVisitaById(Long id) {
        return visitaRepository.findById(id);
    }

    @Override
    @Transactional
    public Visita addVisita(VisitaDto dto) {
        Visita v = new Visita();
        v.setName(dto.getNombre());
        v.setLastName(dto.getApellido());
        v.setDocumento(dto.getDocumento());
        v.setEmail(dto.getEmail());
        v.setTelefono(dto.getTelefono());
        v.setSex(dto.getSexo());
        v.setVisitDate(dto.getFechaIngreso() != null ? dto.getFechaIngreso() : new java.util.Date());
        if (dto.getEmpleadoId() != null) {
            v.setEmpleadoAVisitar(com.access.control.model.Empleado.findById(dto.getEmpleadoId()));
        }
        visitaRepository.persist(v);
        return v;
    }

    @Override
    @Transactional
    public Visita updateVisita(VisitaDto dto, Long id) {
        Visita v = visitaRepository.findById(id);
        if (v != null) {
            v.setName(dto.getNombre());
            v.setLastName(dto.getApellido());
            v.setEmail(dto.getEmail());
            v.setTelefono(dto.getTelefono());
            if (dto.getDocumento() != null) {
                v.setDocumento(dto.getDocumento());
            }
            if (dto.getSexo() != null) {
                v.setSex(dto.getSexo());
            }
            if (dto.getEmpleadoId() != null) {
                v.setEmpleadoAVisitar(com.access.control.model.Empleado.findById(dto.getEmpleadoId()));
            }
        }
        return v;
    }

    @Override
    @Transactional
    public Visita updateVisitaHuella(Visita visitante, Long id) {
        return visitaRepository.findById(id);
    }

    @Override
    @Transactional
    public boolean deleteVisita(Visita visita) {
        if (visita != null && visita.getId() != null) {
            return visitaRepository.deleteById(visita.getId());
        }
        return false;
    }

    @Override
    @Transactional
    public Visita updatePisos(VisitaDto visita, Long id) {
        return visitaRepository.findById(id);
    }
}
