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
        pisoRepository.persist(piso);
        return piso;
    }

    @Override
    @Transactional
    public Piso updatePiso(Piso piso, Long id) {
        Piso p = pisoRepository.findById(id);
        if (p != null) {
            p.setNumeroPiso(piso.getNumeroPiso());
            p.setDescripcion(piso.getDescripcion());
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
