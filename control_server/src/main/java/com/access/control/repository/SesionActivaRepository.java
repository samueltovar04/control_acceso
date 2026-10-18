package com.access.control.repository;

import com.access.control.model.SesionActiva;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class SesionActivaRepository implements PanacheRepository<SesionActiva> {

    public List<SesionActiva> findActivas() {
        return list("activa = true order by ultimaActividad desc");
    }

    public List<SesionActiva> findActivasBySede(Long sedeId) {
        return list("activa = true and sedeId = ?1 order by ultimaActividad desc", sedeId);
    }

    public SesionActiva findByTokenId(String tokenId) {
        return find("tokenId = ?1 and activa = true", tokenId).firstResult();
    }

    public long invalidarPorUsername(String username) {
        return update("activa = false where username = ?1 and activa = true", username);
    }
}
