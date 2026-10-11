package com.access.control.controller;

import com.access.control.model.AccesoRegistro;
import com.access.control.model.Cliente;
import com.access.control.repository.AccesoRegistroRepository;
import com.access.control.repository.ClienteRepository;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Path("/api/v1/acceso")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AccesoResource {

    @Inject
    AccesoRegistroRepository accesoRepository;

    @Inject
    ClienteRepository clienteRepository;

    @GET
    @Path("/registros")
    public List<AccesoRegistro> getRegistrosRecientes() {
        return accesoRepository.findRecientes();
    }

    @POST
    @Path("/validar")
    @Transactional
    public Response validarAcceso(AccesoRegistro solicitud) {
        solicitud.setFechaHora(new Date());

        // Si es acceso de un cliente, validar estado de su membresía
        if (solicitud.getCliente() != null && solicitud.getCliente().getId() != null) {
            Cliente c = clienteRepository.findById(solicitud.getCliente().getId());
            if (c != null) {
                if ("VENCIDA".equals(c.getEstadoSuscripcion()) || "SUSPENDIDA".equals(c.getEstadoSuscripcion())) {
                    solicitud.setConcedido(false);
                    solicitud.setMotivoDenegacion("Membresía vencida o pago pendiente. Pase a recepción.");
                } else {
                    solicitud.setConcedido(true);
                }
            }
        }

        accesoRepository.persist(solicitud);
        return Response.ok(solicitud).build();
    }

    @POST
    @Path("/dispositivo/{id}/abrir")
    @Transactional
    public Response abrirTorniquete(@PathParam("id") Long id, Map<String, Object> body) {
        String operador = body != null && body.containsKey("operador") ? (String) body.get("operador") : "Terminal Vision";
        String ipDispositivo = body != null && body.containsKey("ip") ? (String) body.get("ip") : "192.168.1.168";

        AccesoRegistro registro = new AccesoRegistro();
        registro.setFechaHora(new Date());
        registro.setMetodoVerificacion("RELE_REMOTO");
        registro.setConcedido(true);
        registro.setMotivoDenegacion("Apertura de torniquete IP: " + ipDispositivo + " activada por " + operador);
        accesoRepository.persist(registro);

        Map<String, Object> res = new HashMap<>();
        res.put("dispositivoId", id);
        res.put("ip", ipDispositivo);
        res.put("estado", "ABIERTO");
        res.put("tiempoPulsoMs", 3000);
        res.put("mensaje", "Pulso de apertura enviado satisfactoriamente al torniquete.");
        return Response.ok(res).build();
    }
}
