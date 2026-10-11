package com.access.control.controller;

import com.access.control.model.Membresia;
import com.access.control.model.Promocion;
import com.access.control.model.SuscripcionCliente;
import com.access.control.repository.MembresiaRepository;
import com.access.control.repository.PromocionRepository;
import com.access.control.repository.SuscripcionClienteRepository;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/v1/membresias")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class MembresiaResource {

    @Inject
    MembresiaRepository membresiaRepository;

    @Inject
    PromocionRepository promocionRepository;

    @Inject
    SuscripcionClienteRepository suscripcionRepository;

    @GET
    public List<Membresia> getMembresiasActivas() {
        return membresiaRepository.findActivas();
    }

    @GET
    @Path("/todas")
    public List<Membresia> getTodasMembresias() {
        return membresiaRepository.listAll();
    }

    @POST
    @Transactional
    public Response createMembresia(Membresia membresia) {
        membresiaRepository.persist(membresia);
        return Response.status(Response.Status.CREATED).entity(membresia).build();
    }

    @GET
    @Path("/promociones")
    public List<Promocion> getPromocionesActivas() {
        return promocionRepository.findActivas();
    }

    @POST
    @Path("/promociones")
    @Transactional
    public Response createPromocion(Promocion promocion) {
        promocionRepository.persist(promocion);
        return Response.status(Response.Status.CREATED).entity(promocion).build();
    }

    @POST
    @Path("/suscripciones")
    @Transactional
    public Response suscribirCliente(SuscripcionCliente suscripcion) {
        suscripcionRepository.persist(suscripcion);
        return Response.status(Response.Status.CREATED).entity(suscripcion).build();
    }

    @GET
    @Path("/suscripciones/cliente/{clienteId}")
    public Response getSuscripcionActiva(@PathParam("clienteId") Long clienteId) {
        SuscripcionCliente sub = suscripcionRepository.findActivaPorCliente(clienteId);
        if (sub == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(sub).build();
    }
}
