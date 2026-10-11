package com.access.control.repository;

import com.access.control.model.TipoContrato;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class TipoContratoRepository implements PanacheRepository<TipoContrato> {
}
