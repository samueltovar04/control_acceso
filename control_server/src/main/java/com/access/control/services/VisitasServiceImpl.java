package com.access.control.services;

import com.access.control.model.Visita;
import com.access.control.repository.VisitaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service("visitasServiceImpl")
public class VisitasServiceImpl implements VisitasService{
    @Autowired
    VisitaRepository dao;
    @Override
    @Transactional
    public List<Visita> getListVisitas() {
        return dao.findAll();
    }

    @Override
    @Transactional
    public Visita getVisitaById(Long id) {
        return dao.findById(id).orElse(null);
    }

    @Override
    @Transactional
    public Visita addVisita(Visita visita) {
        return dao.save(visita);
    }

    @Override
    @Transactional
    public Visita updateVisita(Visita visita,Long id) {
        if(dao.existsById(id)){
            return dao.save(visita);
        }else{
            return null;
        }

    }

    @Override
    @Transactional
    public boolean deleteVisita(Visita visita) {
        dao.deleteById(visita.getId());
        return dao.existsById(visita.getId());
    }
}
