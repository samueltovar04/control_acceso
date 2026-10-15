package com.access.control.controller;

import com.access.control.model.Cliente;
import com.access.control.repository.ClienteRepository;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

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
        if (cliente.getMembresiaActual() == null) {
            cliente.setEstadoSuscripcion("SIN_MEMBRESIA");
        } else if (cliente.getEstadoSuscripcion() == null || cliente.getEstadoSuscripcion().trim().isEmpty()) {
            cliente.setEstadoSuscripcion("ACTIVA");
        }
        clienteRepository.persist(cliente);
        return Response.status(Response.Status.CREATED).entity(cliente).build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Response updateCliente(@PathParam("id") Long id, Cliente clienteDetails) {
        try {
            Cliente cliente = clienteRepository.findById(id);
            if (cliente == null) {
                return Response.status(Response.Status.NOT_FOUND).build();
            }
            if (clienteDetails.getNombre() != null) {
                cliente.setNombre(clienteDetails.getNombre());
            }
            if (clienteDetails.getApellido() != null) {
                cliente.setApellido(clienteDetails.getApellido());
            }
            if (clienteDetails.getDocumento() != null) {
                cliente.setDocumento(clienteDetails.getDocumento());
            }
            if (clienteDetails.getCodigoInsignia() != null) {
                cliente.setCodigoInsignia(clienteDetails.getCodigoInsignia());
            }
            if (clienteDetails.getEmail() != null) {
                cliente.setEmail(clienteDetails.getEmail());
            }
            if (clienteDetails.getTelefono() != null) {
                cliente.setTelefono(clienteDetails.getTelefono());
            }
            if (clienteDetails.getFoto() != null) {
                cliente.setFoto(clienteDetails.getFoto());
            }
            if (clienteDetails.getSexo() != null) {
                cliente.setSexo(clienteDetails.getSexo());
            }
            if (clienteDetails.getFechaNacimiento() != null) {
                cliente.setFechaNacimiento(clienteDetails.getFechaNacimiento());
            }
            if (clienteDetails.getEstadoSuscripcion() != null) {
                cliente.setEstadoSuscripcion(clienteDetails.getEstadoSuscripcion());
            }
            if (clienteDetails.getHuella1() != null) cliente.setHuella1(clienteDetails.getHuella1());
            if (clienteDetails.getHuella2() != null) cliente.setHuella2(clienteDetails.getHuella2());
            if (clienteDetails.getFaceVector() != null) cliente.setFaceVector(clienteDetails.getFaceVector());
            if (clienteDetails.getSede() != null) {
                cliente.setSede(clienteDetails.getSede());
            }
            if (clienteDetails.getPisosPermitidos() != null) {
                cliente.setPisosPermitidos(clienteDetails.getPisosPermitidos());
            }
            if (clienteDetails.getMembresiaActual() != null) {
                cliente.setMembresiaActual(clienteDetails.getMembresiaActual());
                if (cliente.getFechaVencimientoMembresia() == null) {
                    int dias = (clienteDetails.getMembresiaActual().getDuracionDias() != null && clienteDetails.getMembresiaActual().getDuracionDias() > 0)
                            ? clienteDetails.getMembresiaActual().getDuracionDias() : 30;
                    java.util.Calendar cal = java.util.Calendar.getInstance();
                    cal.add(java.util.Calendar.DAY_OF_MONTH, dias);
                    cliente.setFechaVencimientoMembresia(cal.getTime());
                    cliente.setFechaProximoCobro(cal.getTime());
                }
            } else if (cliente.getMembresiaActual() == null) {
                cliente.setEstadoSuscripcion("SIN_MEMBRESIA");
            }
            if (clienteDetails.getFechaVencimientoMembresia() != null) {
                cliente.setFechaVencimientoMembresia(clienteDetails.getFechaVencimientoMembresia());
            }
            if (clienteDetails.getFechaProximoCobro() != null) {
                cliente.setFechaProximoCobro(clienteDetails.getFechaProximoCobro());
            }
            clienteRepository.persist(cliente);
            return Response.ok(cliente).build();
        } catch (Exception e) {
            System.err.println("[ClienteResource] Error en updateCliente: " + e.getMessage());
            e.printStackTrace();
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity("{\"error\":\"" + e.getMessage() + "\"}")
                .build();
        }
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

    @GET
    @Path("/{id}/perfil")
    public Response getPerfilCliente(@PathParam("id") Long id) {
        Cliente cliente = clienteRepository.findById(id);
        if (cliente == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(cliente).build();
    }

    @POST
    @Path("/{id}/cancelar-renovacion")
    @Transactional
    public Response cancelarRenovacion(@PathParam("id") Long id) {
        Cliente cliente = clienteRepository.findById(id);
        if (cliente == null && !clienteRepository.listAll().isEmpty()) {
            cliente = clienteRepository.listAll().get(0);
        }
        if (cliente == null) {
            return Response.status(Response.Status.NOT_FOUND).entity(Map.of("error", "Cliente no encontrado")).build();
        }
        cliente.setAutoRenovar(false);
        cliente.setEstadoSuscripcion("CANCELACION_PROGRAMADA");
        clienteRepository.persist(cliente);

        Map<String, Object> res = new HashMap<>();
        res.put("clienteId", cliente.getId());
        res.put("estadoSuscripcion", "CANCELACION_PROGRAMADA");
        res.put("autoRenovar", false);
        res.put("fechaVencimientoMembresia", cliente.getFechaVencimientoMembresia());
        res.put("mensaje", "Renovación automática desactivada. Acceso garantizado hasta la fecha de vencimiento.");
        return Response.ok(res).build();
    }

    @POST
    @Path("/{id}/reactivar-renovacion")
    @Transactional
    public Response reactivarRenovacion(@PathParam("id") Long id) {
        Cliente cliente = clienteRepository.findById(id);
        if (cliente == null && !clienteRepository.listAll().isEmpty()) {
            cliente = clienteRepository.listAll().get(0);
        }
        if (cliente == null) {
            return Response.status(Response.Status.NOT_FOUND).entity(Map.of("error", "Cliente no encontrado")).build();
        }
        cliente.setAutoRenovar(true);
        cliente.setEstadoSuscripcion("ACTIVA");
        clienteRepository.persist(cliente);

        Map<String, Object> res = new HashMap<>();
        res.put("clienteId", cliente.getId());
        res.put("estadoSuscripcion", "ACTIVA");
        res.put("autoRenovar", true);
        res.put("mensaje", "Renovación automática reactivada exitosamente.");
        return Response.ok(res).build();
    }

    @GET
    @Path("/{id}/qr")
    public Response getClienteTokenQr(@PathParam("id") Long id) {
        Cliente cliente = clienteRepository.findById(id);
        if (cliente == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        java.util.Map<String, Object> qrData = new java.util.HashMap<>();
        qrData.put("clienteId", cliente.getId());
        qrData.put("documento", cliente.getDocumento());
        qrData.put("nombreCompleto", cliente.getNombre() + " " + cliente.getApellido());
        qrData.put("estadoMembresia", cliente.getEstadoSuscripcion());
        qrData.put("tokenAcceso", "QR-CLI-" + cliente.getId() + "-" + System.currentTimeMillis());
        return Response.ok(qrData).build();
    }
}
