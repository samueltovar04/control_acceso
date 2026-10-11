package com.access.control.controller;

import com.access.control.model.NotificacionPago;
import com.access.control.repository.NotificacionPagoRepository;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Date;
import java.util.List;

@Path("/api/v1/notificaciones")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class NotificacionResource {

    @Inject
    NotificacionPagoRepository notificacionRepository;

    @GET
    @Path("/cliente/{clienteId}")
    public List<NotificacionPago> getNotificacionesPorCliente(@PathParam("clienteId") Long clienteId) {
        return notificacionRepository.findByCliente(clienteId);
    }

    @POST
    @Transactional
    public Response crearNotificacion(NotificacionPago notificacion) {
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
        notif.setLeido(true);
        return Response.ok(notif).build();
    }
}
