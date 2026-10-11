package com.access.control.repository;

import com.access.control.model.Visita;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class VisitaRepository implements PanacheRepository<Visita> {
    public Visita findByDocumento(String documento) {
        return find("documento", documento).firstResult();
    }
}
