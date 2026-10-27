package com.access.control.controller;

import com.access.control.dto.VisitaDto;
import com.access.control.model.Visita;
import com.access.control.services.VisitasService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/v1/visitas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class VisitasController {

    @Inject
    VisitasService servicioVisitas;

    @GET
    public List<Visita> getAllVisitas() {
        return servicioVisitas.getListVisitas();
    }

    @GET
    @Path("/{id}")
    public Response getVisitaById(@PathParam("id") Long id) {
        Visita v = servicioVisitas.getVisitaById(id);
        if (v == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(v).build();
    }

    @POST
    public Response addVisita(VisitaDto dto) {
        Visita v = servicioVisitas.addVisita(dto);
        return Response.status(Response.Status.CREATED).entity(v).build();
    }

    @PUT
    @Path("/{id}")
    public Response updateVisita(@PathParam("id") Long id, VisitaDto dto) {
        Visita v = servicioVisitas.updateVisita(dto, id);
        if (v == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(v).build();
    }

    @DELETE
    @Path("/{id}")
    public Response deleteVisita(@PathParam("id") Long id) {
        Visita v = servicioVisitas.getVisitaById(id);
        if (v != null && servicioVisitas.deleteVisita(v)) {
            return Response.noContent().build();
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }

    @GET
    @Path("/{id}/qr")
    public Response getVisitaQr(@PathParam("id") Long id) {
        Visita v = servicioVisitas.getVisitaById(id);
        if (v == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        java.util.Map<String, Object> qr = new java.util.HashMap<>();
        qr.put("visitaId", v.getId());
        qr.put("documento", v.getDocumento());
        qr.put("nombreCompleto", v.getNombre() + " " + v.getApellido());
        qr.put("tokenAcceso", "QR-VIS-" + v.getId() + "-" + System.currentTimeMillis());
        return Response.ok(qr).build();
    }
}
