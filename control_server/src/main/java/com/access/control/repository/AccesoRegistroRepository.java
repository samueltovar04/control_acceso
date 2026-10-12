package com.access.control.repository;

import com.access.control.model.AccesoRegistro;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class AccesoRegistroRepository implements PanacheRepository<AccesoRegistro> {

    public List<AccesoRegistro> findRecientes() {
        return find("order by fechaHora desc").page(0, 50).list();
    }

    public List<AccesoRegistro> findByCliente(Long clienteId) {
        return list("cliente.id", Sort.by("fechaHora", Sort.Direction.Descending), clienteId);
    }

    public List<AccesoRegistro> findPermitidos() {
        return find("concedido = true order by fechaHora desc").page(0, 50).list();
    }

    public List<AccesoRegistro> findDenegados() {
        return find("concedido = false order by fechaHora desc").page(0, 50).list();
    }
}
