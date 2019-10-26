package com.access.control.services;

import com.access.control.dto.VisitaDto;
import com.access.control.model.Piso;
import com.access.control.model.PisoPermisoVisita;
import com.access.control.model.Visita;
import com.access.control.repository.PisoPermisoRepository;
import com.access.control.repository.PisoPermisoVisitaRepository;
import com.access.control.repository.PisoRepository;
import com.access.control.repository.VisitaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;

@Service("visitasServiceImpl")
public class VisitasServiceImpl implements VisitasService{
    @Autowired
    VisitaRepository dao;
    @Autowired
    PisoPermisoVisitaRepository pisoPermisoRepository;
    @Autowired
    PisoRepository daoPiso;
    @Autowired
    PisoPermisoVisita pisoPermisoVisita;

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
    public Visita addVisita(VisitaDto visitante) {
        Visita visita = new Visita();
        visita.setBadgeAccess(visitante.getBadgeAccess());
        visita.setDocument(visitante.getDocument());
        visita.setTypeDocument(visitante.getTypeDocument());
        visita.setName(visitante.getName());
        visita.setLastName(visitante.getLastName());
        visita.setSex(visitante.getSex());
        visita.setElements(visitante.getElements());
        visita.setVisitDate(visitante.getVisitDate());
        visita.setPicture(Base64.getDecoder().decode(Arrays.asList(visitante.getPicture().split(",")).get(1)));
        visita.setState(1);
        final Visita visitaFinal = dao.save(visita);
        List<PisoPermisoVisita> listpp = new ArrayList<>();
        PisoPermisoVisita pisoPermiso = new PisoPermisoVisita();
        daoPiso.findAllState(1).forEach(
            p->{
                pisoPermiso.setVisita(visitaFinal);
                pisoPermiso.setPiso(p);
                pisoPermiso.setState(0);
                listpp.add(pisoPermiso);
            }
        );
        visitaFinal.setListPisos(pisoPermisoRepository.saveAll(listpp));
        return visitaFinal;
    }

    @Override
    @Transactional
    public Visita updateVisita(VisitaDto visitante,Long id) {
        Visita visita = new Visita();
        visita.setId(id);
        visita.setBadgeAccess(visitante.getBadgeAccess());
        visita.setDocument(visitante.getDocument());
        visita.setTypeDocument(visitante.getTypeDocument());
        visita.setName(visitante.getName());
        visita.setLastName(visitante.getLastName());
        visita.setSex(visitante.getSex());
        visita.setElements(visitante.getElements());
        visita.setVisitDate(visitante.getVisitDate());
        visita.setPicture(Base64.getDecoder().decode(Arrays.asList(visitante.getPicture().split(",")).get(1)));
        visita.setState(visitante.getState());
        if(dao.existsById(id)){
            return dao.save(visita);
        }else{
            return null;
        }

    }
    @Override
    @Transactional
    public Visita updateVisitaHuellas(Visita visitante,Long id) {
        Visita visita = new Visita();
        visita.setId(id);
        visita.setHuella1(visitante.getHuella1());
        visita.setHuella2(visitante.getHuella2());
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

    @Override
    @Transactional
    public Visita updatePisos(Visita visita){

        pisoPermisoRepository.saveAll(visita.getListPisos());

        return visita;
    }
}
