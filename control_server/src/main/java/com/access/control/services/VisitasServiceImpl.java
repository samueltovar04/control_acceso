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
        v.setNombre(dto.getNombre());
        v.setApellido(dto.getApellido());
        v.setDocumento(dto.getDocumento());
        v.setEmail(dto.getEmail());
        v.setTelefono(dto.getTelefono());
        visitaRepository.persist(v);
        return v;
    }

    @Override
    @Transactional
    public Visita updateVisita(VisitaDto dto, Long id) {
        Visita v = visitaRepository.findById(id);
        if (v != null) {
            v.setNombre(dto.getNombre());
            v.setApellido(dto.getApellido());
            v.setEmail(dto.getEmail());
            v.setTelefono(dto.getTelefono());
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
