package com.access.control.services;

import com.access.control.dto.VisitaDto;
import com.access.control.model.Visita;

import java.util.List;

public interface VisitasService {
    List<Visita> getListVisitas();
    Visita       getVisitaById(Long id);
    Visita       addVisita(VisitaDto visita);
    Visita       updateVisita(VisitaDto visitante,Long id);
    Visita       updateVisitaHuellas(VisitaDto visitante,Long id);
    boolean      deleteVisita(Visita visita);
    Visita       updatePisos(VisitaDto visita,Long id);
}
