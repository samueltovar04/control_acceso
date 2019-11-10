package com.access.control.services;

import com.access.control.model.Gerencia;
import com.access.control.repository.GerenciaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class GerenciaServiceImpl implements GerenciaService{
    @Autowired
    GerenciaRepository dao;
    @Override
    public List<Gerencia> getListGerencias(Object... params) {
        if(params != null && params.length>0){
            return dao.findAll();
        }else {
            return (List<Gerencia>) dao.findAll();
        }
    }

    @Override
    public Gerencia getGerencia(Gerencia params) {
        return null;
    }

    @Override
    public Optional<Gerencia> findById(Long id) {
        return Optional.empty();
    }

    @Override
    public Gerencia getGerenciaById(Long id) {
        return null;
    }

    @Override
    public Gerencia addGerencia(Gerencia obj) {
        return dao.save(obj);
    }

    @Override
    public Gerencia updateGerencia(Gerencia obj, Long id) {
        if(dao.findById(id).isPresent()) {
            return dao.save(obj);
        }else{
            return null;
        }
    }

    @Override
    public Boolean deleteGerencia(Gerencia obj) {
        dao.delete(obj);
        return dao.existsById(obj.getId());
    }
}
