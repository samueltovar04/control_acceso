package com.access.control.services;

import com.access.control.model.Visita;

import java.util.List;

public interface VisitasService {
    List<Visita> getListVisitas();
    Visita       getVisitaById(Long id);
    Visita       addVisita(Visita visita);
    Visita       updateVisita(Visita visita,Long id);
    boolean      deleteVisita(Visita visita);
}
