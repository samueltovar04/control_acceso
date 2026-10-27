package com.access.control.controller;

import com.access.control.model.Cliente;
import com.access.control.model.Empleado;
import com.access.control.model.Piso;
import com.access.control.model.Visita;
import com.access.control.repository.ClienteRepository;
import com.access.control.repository.EmpleadoRepository;
import com.access.control.repository.PisoRepository;
import com.access.control.repository.VisitaRepository;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.ArrayList;
import java.util.List;

@Path("/api/v1/permisos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PermisosController {

    @Inject
    EmpleadoRepository empleadoRepository;

    @Inject
    ClienteRepository clienteRepository;

    @Inject
    VisitaRepository visitaRepository;

    @Inject
    PisoRepository pisoRepository;

    @GET
    @Path("/pisos")
    public List<Piso> getAllPisos() {
        return pisoRepository.listAll();
    }

    @GET
    @Path("/empleados/{id}")
    public Response getPisosEmpleado(@PathParam("id") Long id) {
        Empleado e = empleadoRepository.findById(id);
        if (e == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(e.getPisosPermitidos() != null ? e.getPisosPermitidos() : new ArrayList<>()).build();
    }

    @PUT
    @Path("/empleados/{id}")
    @Transactional
    public Response updatePisosEmpleado(@PathParam("id") Long id, List<Long> pisoIds) {
        Empleado e = empleadoRepository.findById(id);
        if (e == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        List<Piso> pisos = (pisoIds != null && !pisoIds.isEmpty()) 
            ? pisoRepository.list("id in ?1", pisoIds) 
            : new ArrayList<>();
        e.setPisosPermitidos(pisos);
        return Response.ok(e.getPisosPermitidos()).build();
    }

    @GET
    @Path("/usuarios/{id}")
    public Response getPisosUsuario(@PathParam("id") Long userId) {
        Empleado emp = empleadoRepository.find("user.id", userId).firstResult();
        if (emp != null && emp.getPisosPermitidos() != null) {
            return Response.ok(emp.getPisosPermitidos()).build();
        }
        return Response.ok(new ArrayList<>()).build();
    }

    @PUT
    @Path("/usuarios/{id}")
    @Transactional
    public Response updatePisosUsuario(@PathParam("id") Long userId, List<Long> pisoIds) {
        Empleado emp = empleadoRepository.find("user.id", userId).firstResult();
        if (emp != null) {
            List<Piso> pisos = (pisoIds != null && !pisoIds.isEmpty()) 
                ? pisoRepository.list("id in ?1", pisoIds) 
                : new ArrayList<>();
            emp.setPisosPermitidos(pisos);
            return Response.ok(emp.getPisosPermitidos()).build();
        }
        return Response.status(Response.Status.NOT_FOUND)
                .entity(java.util.Map.of("error", "No existe empleado asociado a este usuario para asignar permisos de pisos."))
                .build();
    }

    @GET
    @Path("/clientes/{id}")
    public Response getPisosCliente(@PathParam("id") Long id) {
        Cliente c = clienteRepository.findById(id);
        if (c == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(c.getPisosPermitidos() != null ? c.getPisosPermitidos() : new ArrayList<>()).build();
    }

    @PUT
    @Path("/clientes/{id}")
    @Transactional
    public Response updatePisosCliente(@PathParam("id") Long id, List<Long> pisoIds) {
        Cliente c = clienteRepository.findById(id);
        if (c == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        List<Piso> pisos = (pisoIds != null && !pisoIds.isEmpty()) 
            ? pisoRepository.list("id in ?1", pisoIds) 
            : new ArrayList<>();
        c.setPisosPermitidos(pisos);
        return Response.ok(c.getPisosPermitidos()).build();
    }

    @GET
    @Path("/visitantes/{id}")
    public Response getPisosVisita(@PathParam("id") Long id) {
        Visita v = visitaRepository.findById(id);
        if (v == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(v.getPisosPermitidos() != null ? v.getPisosPermitidos() : new ArrayList<>()).build();
    }

    @PUT
    @Path("/visitantes/{id}")
    @Transactional
    public Response updatePisosVisita(@PathParam("id") Long id, List<Long> pisoIds) {
        Visita v = visitaRepository.findById(id);
        if (v == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        List<Piso> pisos = (pisoIds != null && !pisoIds.isEmpty()) 
            ? pisoRepository.list("id in ?1", pisoIds) 
            : new ArrayList<>();
        v.setPisosPermitidos(pisos);
        return Response.ok(v.getPisosPermitidos()).build();
    }
}
