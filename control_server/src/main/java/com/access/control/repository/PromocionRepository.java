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

    public Promocion findByCodigoActiva(String codigo) {
        if (codigo == null || codigo.trim().isEmpty()) {
            return null;
        }
        return find("UPPER(codigo) = ?1 and activo = true", codigo.trim().toUpperCase()).firstResult();
    }

    public List<Promocion> findVigentesPorMembresia(Long membresiaId) {
        if (membresiaId == null) {
            return list("activo = true and membresiaAplica is null");
        }
        return list("activo = true and (membresiaAplica.id = ?1 or membresiaAplica is null)", membresiaId);
    }
}


