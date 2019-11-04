package com.access.control.services;

import com.access.control.model.Piso;
import com.access.control.repository.PisoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service("pisoServiceImpl")
public class PisoServiceImpl implements PisoService{

    @Autowired
    PisoRepository dao;

    @Override
    @Transactional
    public List<Piso> getListPisos(Object... params) {
        if(params != null && params.length>0){
            return dao.findByArea((String) params[0]);
        }else {
            return (List<Piso>) dao.findAll();
        }

    }

    @Override
    @Transactional
    public  Piso getPiso(Piso params) {
        if (params.getPiso()!=null && !params.getPiso().equals("")){
            return dao.findByPiso(params.getPiso());
        }else{
            return dao.getOne(params.getId());
        }
    }
    @Override
    @Transactional
    public Optional<Piso> findById(Long id) {
        Optional<Piso> p = dao.findById(id);
        return p;
    }

    @Override
    @Transactional
    public Piso getPisoById(Long id) {
        return findById(id).orElse(null);
    }

    @Override
    @Transactional
    public Piso addPiso(Piso obj) {
        return dao.save(obj);
    }

    @Override
    @Transactional
    public Piso updatePiso(Piso obj, Long id) {
        if(dao.findById(id).isPresent()) {
            return dao.save(obj);
        }else{
            return null;
        }
    }

    @Override
    @Transactional
    public Boolean deletePiso(Piso obj) {
        dao.delete(obj);
        return dao.existsById(obj.getId());
    }
}
