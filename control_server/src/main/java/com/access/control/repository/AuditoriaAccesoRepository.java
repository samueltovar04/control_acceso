package com.access.control.repository;

import com.access.control.dto.PageResponseDTO;
import com.access.control.model.AuditoriaAcceso;
import io.quarkus.mongodb.panache.PanacheMongoRepository;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class AuditoriaAccesoRepository implements PanacheMongoRepository<AuditoriaAcceso> {

    public List<AuditoriaAcceso> findRecientes(int limit) {
        int max = limit > 0 ? limit : 100;
        return findAll(Sort.descending("fechaHora")).page(0, max).list();
    }

    public PageResponseDTO<AuditoriaAcceso> findPaginado(int page, int size) {
        int pageIndex = Math.max(page, 0);
        int pageSize = size > 0 ? size : 15;
        long total = count();
        List<AuditoriaAcceso> list = findAll(Sort.descending("fechaHora"))
                .page(pageIndex, pageSize)
                .list();
        return new PageResponseDTO<>(list, total, pageIndex, pageSize);
    }

    public List<AuditoriaAcceso> findByUsername(String username) {
        return find("username", Sort.descending("fechaHora"), username).list();
    }

    public List<AuditoriaAcceso> findBySede(Long sedeId) {
        return find("sedeId", Sort.descending("fechaHora"), sedeId).list();
    }
}
