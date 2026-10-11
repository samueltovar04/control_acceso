package com.access.control.controller;

import com.access.control.model.Sede;
import com.access.control.services.SedeService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/v1/sedes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SedesController {

    @Inject
    SedeService sedeService;

    @GET
    public List<Sede> getAllSedes() {
        return sedeService.getListSedes();
    }

    @GET
    @Path("/{id}")
    public Response getSedeById(@PathParam("id") Long id) {
        Sede s = sedeService.getSedeById(id);
        if (s == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(s).build();
    }

    @POST
    public Response addSede(Sede sede) {
        Sede s = sedeService.addSede(sede);
        return Response.status(Response.Status.CREATED).entity(s).build();
    }

    @PUT
    @Path("/{id}")
    public Response updateSede(@PathParam("id") Long id, Sede sede) {
        Sede s = sedeService.updateSede(sede, id);
        if (s == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(s).build();
    }

    @DELETE
    @Path("/{id}")
    public Response deleteSede(@PathParam("id") Long id) {
        Sede s = sedeService.getSedeById(id);
        if (s != null && sedeService.deleteSede(s)) {
            return Response.noContent().build();
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }
}
