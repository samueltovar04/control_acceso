package com.access.control.controller;

import com.access.control.model.Gerencia;
import com.access.control.services.GerenciaService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/v1/gerencias")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class GerenciasController {

    @Inject
    GerenciaService gerenciaService;

    @GET
    public List<Gerencia> getAllGerencias() {
        return gerenciaService.getListGerencias();
    }

    @GET
    @Path("/{id}")
    public Response getGerenciaById(@PathParam("id") Long id) {
        Gerencia g = gerenciaService.getGerenciaById(id);
        if (g == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(g).build();
    }

    @POST
    public Response addGerencia(Gerencia gerencia) {
        Gerencia g = gerenciaService.addGerencia(gerencia);
        return Response.status(Response.Status.CREATED).entity(g).build();
    }

    @PUT
    @Path("/{id}")
    public Response updateGerencia(@PathParam("id") Long id, Gerencia gerencia) {
        Gerencia g = gerenciaService.updateGerencia(gerencia, id);
        if (g == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(g).build();
    }

    @DELETE
    @Path("/{id}")
    public Response deleteGerencia(@PathParam("id") Long id) {
        Gerencia g = gerenciaService.getGerenciaById(id);
        if (g != null && gerenciaService.deleteGerencia(g)) {
            return Response.noContent().build();
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }
}
