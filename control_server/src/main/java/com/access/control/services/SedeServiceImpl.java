package com.access.control.services;

import com.access.control.model.Sede;
import com.access.control.repository.SedeRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class SedeServiceImpl implements SedeService {

    @Inject
    SedeRepository sedeRepository;

    @Override
    public Sede getSedeById(Long id) {
        return sedeRepository.findById(id);
    }

    @Override
    public List<Sede> getListSedes() {
        return sedeRepository.listAll();
    }

    @Override
    @Transactional
    public Sede addSede(Sede sede) {
        sedeRepository.persist(sede);
        return sede;
    }

    @Override
    @Transactional
    public Sede updateSede(Sede sede, Long id) {
        Sede s = sedeRepository.findById(id);
        if (s != null) {
            s.setNombre(sede.getNombre());
            s.setDireccion(sede.getDireccion());
            s.setTelefono(sede.getTelefono());
            s.setCodigoSucursal(sede.getCodigoSucursal());
        }
        return s;
    }

    @Override
    @Transactional
    public boolean deleteSede(Sede sede) {
        if (sede != null && sede.getId() != null) {
            return sedeRepository.deleteById(sede.getId());
        }
        return false;
    }
}
