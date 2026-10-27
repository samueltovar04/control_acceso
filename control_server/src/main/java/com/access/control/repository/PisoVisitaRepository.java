package com.access.control.repository;

import com.access.control.model.PisoVisita;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class PisoVisitaRepository implements PanacheRepository<PisoVisita> {
}
