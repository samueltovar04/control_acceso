package com.access.control.repository;

import com.access.control.model.Promocion;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class PromocionRepository implements PanacheRepository<Promocion> {

    public List<Promocion> findActivas() {
        return list("activo", true);
    }
}
