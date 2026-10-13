package com.biotrack.resource;

import com.biotrack.entity.TelemetriaLectura;
import com.biotrack.repository.TelemetriaRepository;
import com.biotrack.websocket.VitalSignsWebSocketEndpoint;
import io.smallrye.common.annotation.NonBlocking;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.Instant;
import java.util.List;

@Path("/api/v1/telemetria/gateway-ingest")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class GatewayTelemetriaResource {

    @Inject
    TelemetriaRepository repository;

    @Inject
    VitalSignsWebSocketEndpoint webSocketEndpoint;

    @Inject
    com.access.control.component.VitalSignsWebSocketEndpoint accessVitalWs;

    @POST
    @NonBlocking
    public Uni<Response> recibirLecturaGateway(TelemetriaLectura lectura) {
        if (lectura == null || lectura.id_pulsera == null || lectura.id_pulsera.isBlank()) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST).entity("Payload invalido").build());
        }

        lectura.timestamp = Instant.now();

        // Pipeline asincrono no bloqueante: persistir en MongoDB -> tras confirmacion, despachar a WebSocket
        return Uni.createFrom().item(() -> {
            repository.persist(lectura);
            return lectura;
        })
        .onItem().invoke(inserted -> {
            webSocketEndpoint.broadcast(inserted);
            try {
                String legacyJson = String.format(
                    "{\"tipo\":\"TELEMETRIA\",\"id_pulsera\":\"%s\",\"bpm\":%d,\"spo2\":%d,\"temperatura\":%.2f,\"alerta\":%b,\"estado_alerta\":%d,\"timestamp\":\"%s\"}",
                    inserted.id_pulsera,
                    inserted.bpm,
                    inserted.spo2,
                    inserted.temp,
                    inserted.estado_alerta == 1,
                    inserted.estado_alerta,
                    inserted.timestamp.toString()
                );
                accessVitalWs.broadcast(legacyJson);
            } catch (Exception ignored) {}
        })
        .onItem().transform(inserted ->
            Response.status(Response.Status.ACCEPTED).entity(inserted).build()
        )
        .onFailure().recoverWithItem(err ->
            Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity("Error persistiendo telemetria: " + err.getMessage()).build()
        );
    }

    @GET
    @Path("/historico/{id_pulsera}")
    @NonBlocking
    public Uni<List<TelemetriaLectura>> obtenerHistorico(@PathParam("id_pulsera") String idPulsera) {
        return repository.findUltimas50PorPulsera(idPulsera);
    }

    @GET
    @Path("/historico")
    @NonBlocking
    public Uni<List<TelemetriaLectura>> obtenerHistoricoGeneral(
            @QueryParam("limite") @DefaultValue("2000") int limite,
            @QueryParam("id_pulsera") String idPulsera,
            @QueryParam("fecha") String fecha) {
        
        java.time.Instant desde = null;
        java.time.Instant hasta = null;
        if (fecha != null && !fecha.isBlank()) {
            try {
                java.time.LocalDate ld = java.time.LocalDate.parse(fecha.trim());
                desde = ld.atStartOfDay(java.time.ZoneOffset.UTC).toInstant();
                hasta = ld.plusDays(1).atStartOfDay(java.time.ZoneOffset.UTC).toInstant().minusNanos(1000);
            } catch (Exception ignored) {}
        }

        return repository.findConFiltros(idPulsera, desde, hasta, limite);
    }
}
