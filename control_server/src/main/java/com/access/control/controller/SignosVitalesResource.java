package com.access.control.controller;

import com.access.control.model.SignosVitales;
import com.access.control.repository.SignosVitalesRepository;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Date;
import java.util.List;

@Path("/api/v1/telemetria")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SignosVitalesResource {

    @Inject
    SignosVitalesRepository signosRepository;

    @GET
    @Path("/cliente/{clienteId}")
    public List<SignosVitales> getHistorialCliente(@PathParam("clienteId") Long clienteId) {
        return signosRepository.findByCliente(clienteId);
    }

    @GET
    @Path("/cliente/{clienteId}/ultimo")
    public Response getUltimoCliente(@PathParam("clienteId") Long clienteId) {
        SignosVitales ultimo = signosRepository.findUltimoPorCliente(clienteId);
        if (ultimo == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(ultimo).build();
    }

    @GET
    @Path("/alertas")
    public List<SignosVitales> getAlertasSaludActivas() {
        return signosRepository.findAlertasActivas();
    }

    @POST
    @Path("/signos-vitales")
    @Transactional
    public Response registrarTelemetria(SignosVitales signos) {
        signos.setTimestamp(new Date());

        // Evaluar reglas de alertas automáticas
        if (signos.getRitmocardiacoBpm() != null && (signos.getRitmocardiacoBpm() > 150 || signos.getRitmocardiacoBpm() < 45)) {
            signos.setAlertaSalud(true);
            signos.setMensajeAlerta("Ritmo cardíaco anómalo: " + signos.getRitmocardiacoBpm() + " BPM");
        } else if (signos.getSaturacionOxigenoSpo2() != null && signos.getSaturacionOxigenoSpo2() < 90) {
            signos.setAlertaSalud(true);
            signos.setMensajeAlerta("Nivel crítico de SpO2: " + signos.getSaturacionOxigenoSpo2() + "%");
        } else if (signos.getTemperaturaCorporal() != null && signos.getTemperaturaCorporal() > 38.3) {
            signos.setAlertaSalud(true);
            signos.setMensajeAlerta("Elevada temperatura corporal: " + signos.getTemperaturaCorporal() + "°C");
        }

        signosRepository.persist(signos);
        return Response.status(Response.Status.CREATED).entity(signos).build();
    }
}
