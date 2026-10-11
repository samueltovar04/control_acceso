package com.access.control.repository;

import com.access.control.model.ConciliacionPago;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class ConciliacionPagoRepository implements PanacheRepository<ConciliacionPago> {

    public List<ConciliacionPago> findByEstado(String estado) {
        return list("estado", estado);
    }
}
