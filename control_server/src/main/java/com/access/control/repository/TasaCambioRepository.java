package com.access.control.repository;

import com.access.control.model.TasaCambio;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.LocalDate;
import java.util.Optional;

@ApplicationScoped
public class TasaCambioRepository implements PanacheRepository<TasaCambio> {

    public Optional<TasaCambio> findUltimaVigente(String origen, String destino) {
        return find("monedaOrigen = ?1 and monedaDestino = ?2 order by fechaVigencia desc", origen, destino)
                .firstResultOptional();
    }

    public Optional<TasaCambio> findPorFecha(String origen, String destino, LocalDate fecha) {
        return find("monedaOrigen = ?1 and monedaDestino = ?2 and fechaVigencia = ?3", origen, destino, fecha)
                .firstResultOptional();
    }
}
