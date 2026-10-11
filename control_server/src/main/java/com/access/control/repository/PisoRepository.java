package com.access.control.repository;

import com.access.control.model.Piso;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class PisoRepository implements PanacheRepository<Piso> {
}
