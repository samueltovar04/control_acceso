package com.access.control.services;

import com.access.control.model.Piso;
import com.access.control.repository.PisoRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class PisoServiceImpl implements PisoService {

    @Inject
    PisoRepository pisoRepository;

    @Inject
    com.access.control.repository.SedeRepository sedeRepository;

    @Override
    public Piso getPisoById(Long id) {
        return pisoRepository.findById(id);
    }

    @Override
    public List<Piso> getListPisos() {
        return pisoRepository.listAll();
    }

    @Override
    @Transactional
    public Piso addPiso(Piso piso) {
        if (piso.getSedeId() != null) {
            piso.setSede(sedeRepository.findById(piso.getSedeId()));
        } else if (piso.getSede() != null && piso.getSede().getId() != null) {
            piso.setSede(sedeRepository.findById(piso.getSede().getId()));
        }
        pisoRepository.persist(piso);
        return piso;
    }

    @Override
    @Transactional
    public Piso updatePiso(Piso piso, Long id) {
        Piso p = pisoRepository.findById(id);
        if (p != null) {
            p.setPiso(piso.getPiso());
            p.setDescripcion(piso.getDescripcion());
            p.setArea(piso.getArea());
            if (piso.getState() != null) {
                p.setState(piso.getState());
            }
            if (piso.getSedeId() != null) {
                p.setSede(sedeRepository.findById(piso.getSedeId()));
            } else if (piso.getSede() != null && piso.getSede().getId() != null) {
                p.setSede(sedeRepository.findById(piso.getSede().getId()));
            }
        }
        return p;
    }

    @Override
    @Transactional
    public boolean deletePiso(Piso piso) {
        if (piso != null && piso.getId() != null) {
            return pisoRepository.deleteById(piso.getId());
        }
        return false;
    }
}
