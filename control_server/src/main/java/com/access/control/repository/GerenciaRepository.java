package com.access.control.repository;

import com.access.control.model.Gerencia;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class GerenciaRepository implements PanacheRepository<Gerencia> {
}
