package com.access.control.services;

import com.access.control.dto.VisitaDto;
import com.access.control.model.PisoPermisoVisita;
import com.access.control.model.PisoVisita;
import com.access.control.model.Visita;
import com.access.control.repository.PisoVisitaRepository;
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
    PisoVisitaRepository pisoDao;

    @Override
    @Transactional
    public List<Visita> getListVisitas() {
        return dao.findAll();
    }

    @Override
    @Transactional
    public Visita getVisitaById(Long id) {
        Visita vis = dao.findById(id).orElse(null);
        if (vis != null)
            vis.getListPisos().forEach(
                    p->{
                        if(p!=null)
                            p.setPisoId(p.getPiso().getId());
                    }
            );
        return vis;
    }

    @Override
    @Transactional
    public Visita addVisita(VisitaDto visitante) {
        List<PisoVisita> pisos = pisoDao.findAllState(1);

        List<PisoPermisoVisita> listpp = new ArrayList<>();
        pisos.forEach(
                p->{
                    listpp.add(new PisoPermisoVisita(p,0));
                }
        );
        Visita visita = new Visita(listpp);
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
        Visita visit = dao.getOne(id);
        if(visit!=null){
            visita.setHuella1(visit.getHuella1());
            visita.setHuella2(visit.getHuella2());
            return dao.saveAndFlush(visita);
        }
        return null;

    }
    @Override
    @Transactional
    public Visita updateVisitaHuellas(VisitaDto visita,Long id) {
        Visita visit = dao.getOne(id);
        if(visit!=null){
            visit.setHuella1(visita.getHuella1());
            visit.setHuella2(visita.getHuella2());
            return dao.saveAndFlush(visit);
        }
        return null;
    }

    @Override
    @Transactional
    public boolean deleteVisita(Visita visita) {
        dao.deleteById(visita.getId());
        return dao.existsById(visita.getId());
    }

    @Override
    @Transactional
    public Visita updatePisos(VisitaDto visita,Long id){

        Visita visit = dao.getOne(id);
        if(visit!=null){
            visit.addListPisos(visita.getListPisos());
            return dao.saveAndFlush(visit);
        }
        return null;
    }
}
