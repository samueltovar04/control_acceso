package com.access.control.services;

import com.access.control.model.Gerencia;
import com.access.control.repository.GerenciaRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class GerenciaServiceImpl implements GerenciaService {

    @Inject
    GerenciaRepository gerenciaRepository;

    @Override
    public Gerencia getGerenciaById(Long id) {
        return gerenciaRepository.findById(id);
    }

    @Override
    public List<Gerencia> getListGerencias() {
        return gerenciaRepository.listAll();
    }

    @Override
    @Transactional
    public Gerencia addGerencia(Gerencia gerencia) {
        gerenciaRepository.persist(gerencia);
        return gerencia;
    }

    @Override
    @Transactional
    public Gerencia updateGerencia(Gerencia gerencia, Long id) {
        Gerencia g = gerenciaRepository.findById(id);
        if (g != null) {
            g.setNombre(gerencia.getNombre());
            g.setCodigo(gerencia.getCodigo());
        }
        return g;
    }

    @Override
    @Transactional
    public boolean deleteGerencia(Gerencia gerencia) {
        if (gerencia != null && gerencia.getId() != null) {
            return gerenciaRepository.deleteById(gerencia.getId());
        }
        return false;
    }
}
