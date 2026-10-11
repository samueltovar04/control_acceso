package com.access.control.repository;

import com.access.control.model.Pago;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class PagoRepository implements PanacheRepository<Pago> {

    public List<Pago> findByCliente(Long clienteId) {
        return list("cliente.id", clienteId);
    }

    public List<Pago> findBySede(Long sedeId) {
        return list("sede.id", sedeId);
    }

    public List<Pago> findPendientesConciliacion() {
        return list("estadoPago", "PENDIENTE_CONCILIACION");
    }
}
