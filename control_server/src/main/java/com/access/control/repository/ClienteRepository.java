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

    public Cliente findByIdentificadorRapido(String identificador) {
        return find("documento = ?1 or codigoInsignia = ?1 or qrTokenDinamico = ?1", identificador)
                .firstResult();
    }

    public List<Cliente> findVencidosParaMora(java.util.Date fechaCorte) {
        return list("fechaVencimientoMembresia < ?1 and estadoSuscripcion in ('ACTIVA', 'POR_VENCER', 'PENDIENTE_PAGO')", fechaCorte);
    }

    public List<Cliente> findPendientesConciliacion() {
        return list("estadoSuscripcion", "PENDIENTE_CONCILIAR");
    }

    public List<Cliente> findCancelacionesProgramadasVencidas(java.util.Date fechaCorte) {
        return list("estadoSuscripcion = 'CANCELACION_PROGRAMADA' and fechaVencimientoMembresia <= ?1", fechaCorte);
    }

    public Cliente findByEmail(String email) {
        if (email == null) return null;
        return find("email", email.trim().toLowerCase()).firstResult();
    }

    public Cliente findByUserId(Long userId) {
        if (userId == null) return null;
        return find("user.id", userId).firstResult();
    }

    public Cliente findPrimerCliente() {
        return find("order by id asc").firstResult();
    }
}
