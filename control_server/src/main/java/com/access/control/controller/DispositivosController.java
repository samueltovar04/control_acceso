package com.access.control.controller;

import com.access.control.model.Dispositivo;
import com.access.control.services.DispositivoService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/v1/dispositivos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class DispositivosController {

    @Inject
    DispositivoService dispositivoService;

    @GET
    public List<Dispositivo> getAllDispositivos() {
        return dispositivoService.getListDispositivos();
    }

    @GET
    @Path("/{id}")
    public Response getDispositivoById(@PathParam("id") Long id) {
        Dispositivo d = dispositivoService.getDispositivoById(id);
        if (d == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(d).build();
    }

    @POST
    public Response addDispositivo(Dispositivo dispositivo) {
        Dispositivo d = dispositivoService.addDispositivo(dispositivo);
        return Response.status(Response.Status.CREATED).entity(d).build();
    }

    @PUT
    @Path("/{id}")
    public Response updateDispositivo(@PathParam("id") Long id, Dispositivo dispositivo) {
        Dispositivo d = dispositivoService.updateDispositivo(dispositivo, id);
        if (d == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(d).build();
    }

    @DELETE
    @Path("/{id}")
    public Response deleteDispositivo(@PathParam("id") Long id) {
        Dispositivo d = dispositivoService.getDispositivoById(id);
        if (d != null && dispositivoService.deleteDispositivo(d)) {
            return Response.noContent().build();
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }

    @POST
    @Path("/{id}/abrir")
    public Response accionarTorniquete(@PathParam("id") Long id) {
        Dispositivo d = dispositivoService.getDispositivoById(id);
        if (d == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        java.util.Map<String, Object> res = new java.util.HashMap<>();
        res.put("id", d.getId());
        res.put("nombre", d.getNombre());
        res.put("ip", d.getIp());
        res.put("accion", "PULSO_RELE_ACTIVADO");
        res.put("estado", "ABIERTO");
        res.put("mensaje", "Pulso de apertura concedido al torniquete " + d.getNombre());
        return Response.ok(res).build();
    }
}
