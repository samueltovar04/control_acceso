package com.access.control.controller;

import com.access.control.model.Cliente;
import com.access.control.model.NotificacionPago;
import com.access.control.repository.ClienteRepository;
import com.access.control.repository.NotificacionPagoRepository;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Path("/api/v1/notificaciones")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class NotificacionResource {

    @Inject
    NotificacionPagoRepository notificacionRepository;

    @Inject
    ClienteRepository clienteRepository;

    @Inject
    JsonWebToken jwt;

    private Long getCallerClienteId() {
        if (jwt == null || jwt.getName() == null) return null;
        Object cidClaim = jwt.getClaim("clienteId");
        if (cidClaim instanceof Number) {
            long val = ((Number) cidClaim).longValue();
            if (val > 0) return val;
        }
        Cliente c = clienteRepository.findByEmail(jwt.getName().trim().toLowerCase());
        return c != null ? c.getId() : null;
    }

    private boolean isStaffCaller() {
        if (jwt == null || jwt.getGroups() == null) return false;
        Set<String> groups = jwt.getGroups();
        for (String g : groups) {
            if (g == null) continue;
            String up = g.toUpperCase();
            if (up.contains("ADMIN") || up.contains("OPERACION") || up.contains("RECEPCION") || up.contains("CONTABLE") || up.contains("ANALISTA")) {
                return true;
            }
        }
        return false;
    }

    @GET
    @Path("/cliente/{clienteId}")
    public List<NotificacionPago> getNotificacionesPorCliente(@PathParam("clienteId") Long clienteId) {
        return notificacionRepository.findByCliente(clienteId);
    }

    @POST
    @Transactional
    public Response crearNotificacion(NotificacionPago notificacion) {
        if (!isStaffCaller()) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of("error", "Acceso denegado: Creacion de notificaciones reservada al personal."))
                    .build();
        }
        notificacion.setFechaEnvio(new Date());
        notificacionRepository.persist(notificacion);
        return Response.status(Response.Status.CREATED).entity(notificacion).build();
    }

    @PUT
    @Path("/{id}/marcar-leida")
    @Transactional
    public Response marcarLeida(@PathParam("id") Long id) {
        NotificacionPago notif = notificacionRepository.findById(id);
        if (notif == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        if (!isStaffCaller()) {
            Long callerCid = getCallerClienteId();
            if (callerCid == null || notif.getCliente() == null || !callerCid.equals(notif.getCliente().getId())) {
                return Response.status(Response.Status.FORBIDDEN)
                        .entity(Map.of("error", "Acceso denegado: No puede modificar notificaciones de otro cliente."))
                        .build();
            }
        }

        notif.setLeido(true);
        return Response.ok(notif).build();
    }
}
