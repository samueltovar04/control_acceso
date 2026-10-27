package com.access.control.controller;

import com.access.control.model.TipoContrato;
import com.access.control.services.TipoContratoService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/v1/tipocontratos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TipoContratosController {

    @Inject
    TipoContratoService tipoContratoService;

    @GET
    public List<TipoContrato> getAllTipoContratos() {
        return tipoContratoService.getListTipoContratos();
    }

    @GET
    @Path("/{id}")
    public Response getTipoContratoById(@PathParam("id") Long id) {
        TipoContrato tc = tipoContratoService.getTipoContratoById(id);
        if (tc == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(tc).build();
    }

    @POST
    public Response addTipoContrato(TipoContrato tipoContrato) {
        TipoContrato tc = tipoContratoService.addTipoContrato(tipoContrato);
        return Response.status(Response.Status.CREATED).entity(tc).build();
    }

    @PUT
    @Path("/{id}")
    public Response updateTipoContrato(@PathParam("id") Long id, TipoContrato tipoContrato) {
        TipoContrato tc = tipoContratoService.updateTipoContrato(tipoContrato, id);
        if (tc == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(tc).build();
    }

    @DELETE
    @Path("/{id}")
    public Response deleteTipoContrato(@PathParam("id") Long id) {
        TipoContrato tc = tipoContratoService.getTipoContratoById(id);
        if (tc != null && tipoContratoService.deleteTipoContrato(tc)) {
            return Response.noContent().build();
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }
}
