package com.access.control.repository;

import com.access.control.model.NotificacionPago;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class NotificacionPagoRepository implements PanacheRepository<NotificacionPago> {

    public List<NotificacionPago> findByCliente(Long clienteId) {
        return list("cliente.id", Sort.by("fechaEnvio", Sort.Direction.Descending), clienteId);
    }

    public List<NotificacionPago> findNoLeidasPorCliente(Long clienteId) {
        return list("cliente.id = ?1 and leido = false", Sort.by("fechaEnvio", Sort.Direction.Descending), clienteId);
    }
}
