package com.access.control.repository;

import com.access.control.model.Membresia;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class MembresiaRepository implements PanacheRepository<Membresia> {

    public List<Membresia> findActivas() {
        return list("activo", true);
    }

    public List<Membresia> findByPeriodicidad(String periodicidad) {
        return list("periodicidad", periodicidad);
    }
}
