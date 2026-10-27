package com.access.control.repository;

import com.access.control.dto.PageResponseDTO;
import com.access.control.model.BitacoraEventoPaso;
import io.quarkus.mongodb.panache.PanacheMongoRepository;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class BitacoraEventoPasoRepository implements PanacheMongoRepository<BitacoraEventoPaso> {

    public List<BitacoraEventoPaso> findRecientes(int limit) {
        int max = limit > 0 ? limit : 20;
        return findAll(Sort.descending("fechaHora")).page(0, max).list();
    }

    public PageResponseDTO<BitacoraEventoPaso> findPaginado(int page, int size, Long sedeId) {
        int pageIndex = Math.max(page, 0);
        int pageSize = size > 0 ? size : 15;

        if (sedeId != null) {
            long total = count("sedeId", sedeId);
            List<BitacoraEventoPaso> list = find("sedeId", Sort.descending("fechaHora"), sedeId)
                    .page(pageIndex, pageSize)
                    .list();
            return new PageResponseDTO<>(list, total, pageIndex, pageSize);
        } else {
            long total = count();
            List<BitacoraEventoPaso> list = findAll(Sort.descending("fechaHora"))
                    .page(pageIndex, pageSize)
                    .list();
            return new PageResponseDTO<>(list, total, pageIndex, pageSize);
        }
    }
}
