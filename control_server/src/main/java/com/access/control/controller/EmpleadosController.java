package com.access.control.controller;

import com.access.control.dto.EmpleadoDto;
import com.access.control.model.Empleado;
import com.access.control.services.EmpleadosService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/v1/empleados")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class EmpleadosController {

    @Inject
    EmpleadosService servicioEmpleado;

    @GET
    public List<Empleado> getAllEmpleados() {
        return servicioEmpleado.getListEmpleados(true);
    }

    @GET
    @Path("/{id}")
    public Response getEmpleadoById(@PathParam("id") Long id) {
        Empleado e = servicioEmpleado.getEmpleadoById(id);
        if (e == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(e).build();
    }

    @POST
    public Response addEmpleado(EmpleadoDto dto) {
        Empleado e = servicioEmpleado.addEmpleado(dto);
        return Response.status(Response.Status.CREATED).entity(e).build();
    }

    @PUT
    @Path("/{id}")
    public Response updateEmpleado(@PathParam("id") Long id, EmpleadoDto dto) {
        Empleado e = servicioEmpleado.updateEmpleado(dto, id);
        if (e == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(e).build();
    }

    @DELETE
    @Path("/{id}")
    public Response deleteEmpleado(@PathParam("id") Long id) {
        Empleado e = servicioEmpleado.getEmpleadoById(id);
        if (e != null && servicioEmpleado.deleteEmpleado(e)) {
            return Response.noContent().build();
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }

    @GET
    @Path("/{id}/perfil")
    public Response getPerfilEmpleado(@PathParam("id") Long id) {
        Empleado e = servicioEmpleado.getEmpleadoById(id);
        if (e == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(e).build();
    }

    @GET
    @Path("/{id}/qr")
    public Response getEmpleadoTokenQr(@PathParam("id") Long id) {
        Empleado e = servicioEmpleado.getEmpleadoById(id);
        if (e == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        java.util.Map<String, Object> qrData = new java.util.HashMap<>();
        qrData.put("empleadoId", e.getId());
        qrData.put("documento", e.getDocumento());
        qrData.put("nombreCompleto", e.getNombre() + " " + e.getApellido());
        qrData.put("codigoInsignia", e.getCodigoInsignia());
        qrData.put("tokenAcceso", "QR-EMP-" + e.getId() + "-" + System.currentTimeMillis());
        return Response.ok(qrData).build();
    }
}
