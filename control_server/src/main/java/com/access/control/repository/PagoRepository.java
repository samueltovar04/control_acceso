package com.access.control.repository;

import com.access.control.model.Pago;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class PagoRepository implements PanacheRepository<Pago> {

    public List<Pago> findByCliente(Long clienteId) {
        return list("cliente.id = ?1 order by id desc", clienteId);
    }

    public List<Pago> findPendientesPorCliente(Long clienteId) {
        return list("cliente.id = ?1 and estadoPago in ('PENDIENTE_PAGO', 'PENDIENTE_CONCILIACION', 'PENDIENTE_CONCILIAR', 'NO_PAGADO') order by id desc", clienteId);
    }

    public List<Pago> findBySede(Long sedeId) {
        return list("sede.id", sedeId);
    }

    public List<Pago> findPendientesConciliacion() {
        return list("estadoPago in ('PENDIENTE_CONCILIAR', 'PENDIENTE_CONCILIACION') order by fechaPago desc");
    }

    public Pago findByComprobanteSha256(String sha256) {
        if (sha256 == null || sha256.trim().isEmpty()) {
            return null;
        }
        return find("comprobanteSha256", sha256).firstResult();
    }

    public Pago findByReferenciaYMetodo(String metodo, String ref) {
        return find("metodoPago = ?1 and numeroReferencia = ?2", metodo, ref).firstResult();
    }
}
