package com.access.control.services;

import com.access.control.model.TipoContrato;
import com.access.control.repository.TipoContratoRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class TipoContratoServiceImpl implements TipoContratoService {

    @Inject
    TipoContratoRepository tipoContratoRepository;

    @Override
    public TipoContrato getTipoContratoById(Long id) {
        return tipoContratoRepository.findById(id);
    }

    @Override
    public List<TipoContrato> getListTipoContratos() {
        return tipoContratoRepository.listAll();
    }

    @Override
    @Transactional
    public TipoContrato addTipoContrato(TipoContrato tipoContrato) {
        tipoContratoRepository.persist(tipoContrato);
        return tipoContrato;
    }

    @Override
    @Transactional
    public TipoContrato updateTipoContrato(TipoContrato tipoContrato, Long id) {
        TipoContrato tc = tipoContratoRepository.findById(id);
        if (tc != null) {
            tc.setNombre(tipoContrato.getNombre());
            tc.setDescripcion(tipoContrato.getDescripcion());
        }
        return tc;
    }

    @Override
    @Transactional
    public boolean deleteTipoContrato(TipoContrato tipoContrato) {
        if (tipoContrato != null && tipoContrato.getId() != null) {
            return tipoContratoRepository.deleteById(tipoContrato.getId());
        }
        return false;
    }
}
