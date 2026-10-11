package com.access.control.repository;

import com.access.control.model.Cliente;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class ClienteRepository implements PanacheRepository<Cliente> {

    public Cliente findByDocumento(String documento) {
        return find("documento", documento).firstResult();
    }

    public Cliente findByCodigoInsignia(String codigo) {
        return find("codigoInsignia", codigo).firstResult();
    }

    public List<Cliente> findBySede(Long sedeId) {
        return list("sede.id", sedeId);
    }

    public List<Cliente> findByEstadoSuscripcion(String estado) {
        return list("estadoSuscripcion", estado);
    }
}
