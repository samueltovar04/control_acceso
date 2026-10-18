package com.access.control.repository;

import com.access.control.model.AuditoriaAcceso;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class AuditoriaAccesoRepository implements PanacheRepository<AuditoriaAcceso> {

    public List<AuditoriaAcceso> findRecientes(int limit) {
        return find("order by fechaHora desc").page(0, limit).list();
    }

    public List<AuditoriaAcceso> findByUsername(String username) {
        return list("username = ?1 order by fechaHora desc", username);
    }

    public List<AuditoriaAcceso> findBySede(Long sedeId) {
        return list("sedeId = ?1 order by fechaHora desc", sedeId);
    }
}
