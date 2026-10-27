package com.access.control.repository;

import com.access.control.model.Empleado;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class EmpleadoRepository implements PanacheRepository<Empleado> {
    public Empleado findByDocumento(String documento) {
        if (documento == null || documento.trim().isEmpty()) return null;
        try {
            Integer docInt = Integer.parseInt(documento.replaceAll("\\D", ""));
            return find("document", docInt).firstResult();
        } catch (Exception e) {
            return null;
        }
    }
}
