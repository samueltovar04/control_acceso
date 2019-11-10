package com.access.control.services;

import com.access.control.model.Sede;
import com.access.control.repository.SedeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SedeServiceImpl implements SedeService {
    @Autowired
    SedeRepository dao;
    @Override
    public List<Sede> getListSedes(Object... params) {
        if(params != null && params.length>0){
            return dao.findAll();
        }else {
            return (List<Sede>) dao.findAll();
        }
    }

    @Override
    public Sede getSede(Sede params) {
        return dao.getOne(params.getId());
    }

    @Override
    public Optional<Sede> findById(Long id) {
        return dao.findById(id);
    }

    @Override
    public Sede getSedeById(Long id) {
        return dao.findById(id).orElse(null);
    }

    @Override
    public Sede addSede(Sede obj) {
        return dao.save(obj);
    }

    @Override
    public Sede updateSede(Sede obj, Long id) {
        if(dao.findById(id).isPresent()) {
            return dao.save(obj);
        }else{
            return null;
        }
    }

    @Override
    public Boolean deleteSede(Sede obj) {
        dao.delete(obj);
        return dao.existsById(obj.getId());
    }
}
