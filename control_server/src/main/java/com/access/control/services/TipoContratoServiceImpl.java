package com.access.control.services;

import com.access.control.model.TipoContrato;
import com.access.control.repository.TipoContratoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TipoContratoServiceImpl implements TipoContratoService {
    @Autowired
    TipoContratoRepository dao;
    @Override
    public List<TipoContrato> getListTipoContratos(Object... params) {
        if(params != null && params.length>0){
            return dao.findAll();
        }else {
            return (List<TipoContrato>) dao.findAll();
        }
    }

    @Override
    public TipoContrato getTipoContrato(TipoContrato params) {
        return null;
    }

    @Override
    public Optional<TipoContrato> findById(Long id) {
        return Optional.empty();
    }

    @Override
    public TipoContrato getTipoContratoById(Long id) {
        return null;
    }

    @Override
    public TipoContrato addTipoContrato(TipoContrato obj) {
        return dao.save(obj);
    }

    @Override
    public TipoContrato updateTipoContrato(TipoContrato obj, Long id) {
        if(dao.findById(id).isPresent()) {
            return dao.save(obj);
        }else{
            return null;
        }
    }

    @Override
    public Boolean deleteTipoContrato(TipoContrato obj) {
        dao.delete(obj);
        return dao.existsById(obj.getId());
    }
}
