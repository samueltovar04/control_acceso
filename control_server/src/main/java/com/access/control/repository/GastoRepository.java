package com.access.control.repository;

import com.access.control.model.Gasto;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class GastoRepository implements PanacheRepository<Gasto> {

    public List<Gasto> findBySede(Long sedeId) {
        return list("sede.id", sedeId);
    }

    public List<Gasto> findByCategoria(String categoria) {
        return list("categoria", categoria);
    }
}
