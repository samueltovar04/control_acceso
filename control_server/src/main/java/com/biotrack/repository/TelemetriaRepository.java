package com.biotrack.repository;

import com.biotrack.entity.TelemetriaLectura;
import io.quarkus.mongodb.panache.PanacheMongoRepositoryBase;
import io.quarkus.panache.common.Sort;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import org.bson.types.ObjectId;

import java.util.List;

@ApplicationScoped
public class TelemetriaRepository implements PanacheMongoRepositoryBase<TelemetriaLectura, ObjectId> {

    public Uni<List<TelemetriaLectura>> findUltimas50PorPulsera(String idPulsera) {
        return Uni.createFrom().item(() ->
            find("id_pulsera", Sort.descending("timestamp"), idPulsera)
                .page(0, 50)
                .list()
        );
    }

    public Uni<List<TelemetriaLectura>> findRecientes(int limite) {
        return Uni.createFrom().item(() ->
            findAll(Sort.descending("timestamp"))
                .page(0, Math.min(Math.max(limite, 50), 2000))
                .list()
        );
    }

    public Uni<List<TelemetriaLectura>> findConFiltros(String idPulsera, java.time.Instant desde, java.time.Instant hasta, int limite) {
        return Uni.createFrom().item(() -> {
            int maxLimit = Math.min(Math.max(limite, 50), 2000);
            if (idPulsera != null && !idPulsera.isBlank() && desde != null && hasta != null) {
                return find("id_pulsera = ?1 and timestamp >= ?2 and timestamp <= ?3",
                        Sort.descending("timestamp"), idPulsera.trim().toUpperCase(), desde, hasta)
                        .page(0, maxLimit)
                        .list();
            } else if (idPulsera != null && !idPulsera.isBlank()) {
                return find("id_pulsera", Sort.descending("timestamp"), idPulsera.trim().toUpperCase())
                        .page(0, maxLimit)
                        .list();
            } else if (desde != null && hasta != null) {
                return find("timestamp >= ?1 and timestamp <= ?2", Sort.descending("timestamp"), desde, hasta)
                        .page(0, maxLimit)
                        .list();
            }
            return findAll(Sort.descending("timestamp")).page(0, maxLimit).list();
        });
    }

    public Uni<TelemetriaLectura> findUltimoPorPulsera(String idPulsera) {
        return Uni.createFrom().item(() ->
            find("id_pulsera", Sort.descending("timestamp"), idPulsera).firstResult()
        );
    }

    public Uni<List<TelemetriaLectura>> findAlertasActivas() {
        return Uni.createFrom().item(() ->
            find("estado_alerta", Sort.descending("timestamp"), 1)
                .page(0, 50)
                .list()
        );
    }

    public Multi<TelemetriaLectura> streamUltimas50PorPulsera(String idPulsera) {
        return findUltimas50PorPulsera(idPulsera)
            .onItem().transformToMulti(list -> Multi.createFrom().iterable(list));
    }
}
