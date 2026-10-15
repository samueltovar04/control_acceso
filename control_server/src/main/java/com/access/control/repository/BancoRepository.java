package com.access.control.repository;

import com.access.control.model.Banco;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class BancoRepository implements PanacheRepository<Banco> {

    public List<Banco> findActivos() {
        return list("activo", true);
    }

    public List<Banco> findByTipo(String tipo) {
        return list("tipo = ?1 and activo = true", tipo);
    }
}
