package com.access.control.controller;

import com.access.control.model.Cliente;
import com.access.control.repository.ClienteRepository;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/v1/clientes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ClienteResource {

    @Inject
    ClienteRepository clienteRepository;

    @GET
    public List<Cliente> getAllClientes() {
        return clienteRepository.listAll();
    }

    @GET
    @Path("/{id}")
    public Response getClienteById(@PathParam("id") Long id) {
        Cliente cliente = clienteRepository.findById(id);
        if (cliente == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(cliente).build();
    }

    @GET
    @Path("/documento/{doc}")
    public Response getClienteByDocumento(@PathParam("doc") String doc) {
        Cliente cliente = clienteRepository.findByDocumento(doc);
        if (cliente == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(cliente).build();
    }

    @POST
    @Transactional
    public Response createCliente(Cliente cliente) {
        clienteRepository.persist(cliente);
        return Response.status(Response.Status.CREATED).entity(cliente).build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Response updateCliente(@PathParam("id") Long id, Cliente clienteDetails) {
        Cliente cliente = clienteRepository.findById(id);
        if (cliente == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        cliente.setNombre(clienteDetails.getNombre());
        cliente.setApellido(clienteDetails.getApellido());
        cliente.setEmail(clienteDetails.getEmail());
        cliente.setTelefono(clienteDetails.getTelefono());
        cliente.setFoto(clienteDetails.getFoto());
        cliente.setSexo(clienteDetails.getSexo());
        cliente.setFechaNacimiento(clienteDetails.getFechaNacimiento());
        if (clienteDetails.getSede() != null) {
            cliente.setSede(clienteDetails.getSede());
        }
        return Response.ok(cliente).build();
    }

    @PUT
    @Path("/{id}/biometria")
    @Transactional
    public Response updateBiometria(@PathParam("id") Long id, Cliente biometriaData) {
        Cliente cliente = clienteRepository.findById(id);
        if (cliente == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        if (biometriaData.getHuella1() != null) cliente.setHuella1(biometriaData.getHuella1());
        if (biometriaData.getHuella2() != null) cliente.setHuella2(biometriaData.getHuella2());
        if (biometriaData.getFaceVector() != null) cliente.setFaceVector(biometriaData.getFaceVector());
        return Response.ok(cliente).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response deleteCliente(@PathParam("id") Long id) {
        boolean deleted = clienteRepository.deleteById(id);
        if (!deleted) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.noContent().build();
    }
}
