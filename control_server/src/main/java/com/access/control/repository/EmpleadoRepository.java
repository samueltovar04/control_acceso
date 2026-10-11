package com.access.control.repository;

import com.access.control.model.Empleado;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class EmpleadoRepository implements PanacheRepository<Empleado> {
    public Empleado findByDocumento(String documento) {
        return find("documento", documento).firstResult();
    }
}
