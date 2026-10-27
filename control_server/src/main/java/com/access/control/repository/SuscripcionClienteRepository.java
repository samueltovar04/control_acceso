package com.access.control.repository;

import com.access.control.model.SuscripcionCliente;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Date;
import java.util.List;

@ApplicationScoped
public class SuscripcionClienteRepository implements PanacheRepository<SuscripcionCliente> {

    public SuscripcionCliente findActivaPorCliente(Long clienteId) {
        return find("cliente.id = ?1 and estado = 'ACTIVA'", clienteId).firstResult();
    }

    public List<SuscripcionCliente> findPorVencer(Date fechaLimite) {
        return list("fechaFin <= ?1 and estado = 'ACTIVA'", fechaLimite);
    }

    public List<SuscripcionCliente> findVencidas(Date fechaActual) {
        return list("fechaFin < ?1 and estado != 'VENCIDA'", fechaActual);
    }
}
