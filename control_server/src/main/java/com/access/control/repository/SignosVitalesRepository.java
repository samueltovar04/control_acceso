package com.access.control.repository;

import com.access.control.model.SignosVitales;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class SignosVitalesRepository implements PanacheRepository<SignosVitales> {

    public List<SignosVitales> findByCliente(Long clienteId) {
        return list("cliente.id", Sort.by("timestamp", Sort.Direction.Descending), clienteId);
    }

    public SignosVitales findUltimoPorCliente(Long clienteId) {
        return find("cliente.id", Sort.by("timestamp", Sort.Direction.Descending), clienteId).firstResult();
    }

    public List<SignosVitales> findAlertasActivas() {
        return list("alertaSalud", Sort.by("timestamp", Sort.Direction.Descending), true);
    }
}
