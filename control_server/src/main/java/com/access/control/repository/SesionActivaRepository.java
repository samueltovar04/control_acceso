package com.access.control.repository;

import com.access.control.dto.PageResponseDTO;
import com.access.control.model.SesionActiva;
import io.quarkus.mongodb.panache.PanacheMongoRepository;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class SesionActivaRepository implements PanacheMongoRepository<SesionActiva> {

    public List<SesionActiva> findActivas() {
        return find("activa", Sort.descending("ultimaActividad"), true).list();
    }

    public PageResponseDTO<SesionActiva> findActivasPaginado(int page, int size) {
        int pageIndex = Math.max(page, 0);
        int pageSize = size > 0 ? size : 10;
        long total = count("activa", true);
        List<SesionActiva> list = find("activa", Sort.descending("ultimaActividad"), true)
                .page(pageIndex, pageSize)
                .list();
        return new PageResponseDTO<>(list, total, pageIndex, pageSize);
    }

    public List<SesionActiva> findActivasBySede(Long sedeId) {
        return find("activa = ?1 and sedeId = ?2", Sort.descending("ultimaActividad"), true, sedeId).list();
    }

    public SesionActiva findByTokenId(String tokenId) {
        return find("tokenId = ?1 and activa = ?2", tokenId, true).firstResult();
    }

    public void invalidarPorUsername(String username) {
        if (username == null) return;
        List<SesionActiva> activas = find("username = ?1 and activa = ?2", username, true).list();
        for (SesionActiva s : activas) {
            s.setActiva(false);
            update(s);
        }
    }
}
