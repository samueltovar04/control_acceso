package com.access.control.controller;

import com.access.control.model.Piso;
import com.access.control.services.PisoService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/v1/pisos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PisosController {

    @Inject
    PisoService pisoService;

    @GET
    public List<Piso> getAllPisos() {
        return pisoService.getListPisos();
    }

    @GET
    @Path("/{id}")
    public Response getPisoById(@PathParam("id") Long id) {
        Piso p = pisoService.getPisoById(id);
        if (p == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(p).build();
    }

    @POST
    public Response addPiso(Piso piso) {
        Piso p = pisoService.addPiso(piso);
        return Response.status(Response.Status.CREATED).entity(p).build();
    }

    @PUT
    @Path("/{id}")
    public Response updatePiso(@PathParam("id") Long id, Piso piso) {
        Piso p = pisoService.updatePiso(piso, id);
        if (p == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(p).build();
    }

    @DELETE
    @Path("/{id}")
    public Response deletePiso(@PathParam("id") Long id) {
        Piso p = pisoService.getPisoById(id);
        if (p != null && pisoService.deletePiso(p)) {
            return Response.noContent().build();
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }
}
