package com.biotrack.resource;

import com.biotrack.entity.TelemetriaVitalEntity;
import com.biotrack.repository.TelemetriaVitalRepository;
import com.biotrack.websocket.VitalSignsWebSocketEndpoint;
import io.smallrye.common.annotation.NonBlocking;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.time.LocalDateTime;

@Path("/api/v1/telemetria/vitales")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class VitalSignsResource {

    @Inject
    TelemetriaVitalRepository repository;

    @Inject
    VitalSignsWebSocketEndpoint webSocketEndpoint;

    @POST
    @NonBlocking
    public Uni<Response> recibirTelemetria(TelemetriaVitalEntity data) {
        return Uni.createFrom().item(() -> {
            if (data == null || data.id_pulsera == null) {
                return Response.status(Response.Status.BAD_REQUEST).entity("Payload de telemetria invalido").build();
            }

            data.timestamp = LocalDateTime.now();

            // Persistencia reactiva en MongoDB
            repository.persist(data);

            // Despacho inmediato y asincrono por WebSockets
            webSocketEndpoint.broadcast(data);

            return Response.status(Response.Status.ACCEPTED).entity(data).build();
        });
    }

    @GET
    @Path("/pulsera/{id}")
    @NonBlocking
    public Uni<Response> getHistorial(@PathParam("id") String id) {
        return Uni.createFrom().item(() -> Response.ok(repository.findByPulsera(id)).build());
    }

    @GET
    @Path("/alertas")
    @NonBlocking
    public Uni<Response> getAlertas() {
        return Uni.createFrom().item(() -> Response.ok(repository.findAlertasActivas()).build());
    }
}
