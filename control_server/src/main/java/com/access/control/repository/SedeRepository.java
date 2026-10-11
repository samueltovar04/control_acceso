package com.access.control.repository;

import com.access.control.model.Sede;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class SedeRepository implements PanacheRepository<Sede> {
}
