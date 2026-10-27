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
@io.smallrye.common.annotation.Blocking
public class SignosVitalesResource {

    @Inject
    com.biotrack.repository.TelemetriaRepository telemetriaMongoRepo;

    @Inject
    com.access.control.repository.ClienteRepository clienteRepository;

    @Inject
    com.access.control.component.VitalSignsWebSocketEndpoint vitalWs;

    @Inject
    com.access.control.component.NotificacionesWebSocketEndpoint notifWs;

    @GET
    @Path("/cliente/{clienteId}")
    public io.smallrye.mutiny.Uni<List<com.biotrack.entity.TelemetriaLectura>> getHistorialCliente(@PathParam("clienteId") Long clienteId) {
        com.access.control.model.Cliente cliente = clienteRepository.findById(clienteId);
        if (cliente == null || cliente.getCodigoInsignia() == null || cliente.getCodigoInsignia().isBlank()) {
            return io.smallrye.mutiny.Uni.createFrom().item(java.util.Collections.emptyList());
        }
        return telemetriaMongoRepo.findUltimas50PorPulsera(cliente.getCodigoInsignia().trim().toUpperCase());
    }

    @GET
    @Path("/cliente/{clienteId}/ultimo")
    public io.smallrye.mutiny.Uni<Response> getUltimoCliente(@PathParam("clienteId") Long clienteId) {
        com.access.control.model.Cliente cliente = clienteRepository.findById(clienteId);
        String pulseraCode = null;

        if (cliente != null && cliente.getCodigoInsignia() != null && !cliente.getCodigoInsignia().isBlank()) {
            pulseraCode = cliente.getCodigoInsignia().trim().toUpperCase();
        } else if (cliente != null && cliente.getEmail() != null) {
            com.biotrack.entity.UsuarioEntity usr = com.biotrack.entity.UsuarioEntity.findByCorreo(cliente.getEmail().trim().toLowerCase());
            if (usr != null && usr.idPulseraAsignada != null && !usr.idPulseraAsignada.isBlank()) {
                pulseraCode = usr.idPulseraAsignada.trim().toUpperCase();
            }
        }

        if (pulseraCode == null) {
            pulseraCode = "002"; // Pulsera asignada 002 por defecto
        }

        final String macPulseraFinal = pulseraCode;

        return telemetriaMongoRepo.findUltimoPorPulsera(macPulseraFinal)
            .onItem().transform(lectura -> {
                if (lectura == null) {
                    java.util.Map<String, Object> resp0 = new java.util.HashMap<>();
                    resp0.put("id_pulsera", macPulseraFinal);
                    resp0.put("cliente_id", clienteId);
                    resp0.put("bpm", 0);
                    resp0.put("spo2", 0);
                    resp0.put("temp", 0.0);
                    resp0.put("temperatura", 0.0);
                    resp0.put("estado", "PULSERA_ASOCIADA_SIN_LECTURAS");
                    return Response.ok(resp0).build();
                }
                return Response.ok(lectura).build();
            });
    }

    @GET
    @Path("/alertas")
    public io.smallrye.mutiny.Uni<List<com.biotrack.entity.TelemetriaLectura>> getAlertasSaludActivas() {
        return telemetriaMongoRepo.findAlertasActivas();
    }

    @Inject
    com.access.control.repository.DispositivoRepository dispositivoRepository;

    @POST
    @Path("/gateway")
    public io.smallrye.mutiny.Uni<Response> registrarGatewayTelemetria(com.access.control.dto.GatewayTelemetriaDTO dto) {
        if (dto == null) {
            return io.smallrye.mutiny.Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST).entity("Payload vacio").build());
        }

        String mac = dto.getId_pulsera() != null ? dto.getId_pulsera().trim().toUpperCase() : "ESP32-MAC-PICO";
        int bpm = dto.getBpm() != null ? Math.round(dto.getBpm()) : 75;
        int spo2 = dto.getSpo2() != null ? Math.round(dto.getSpo2()) : 98;
        double temp = dto.getTemperatura() != null ? ((double) Math.round(dto.getTemperatura() * 100.0) / 100.0) : 36.5;
        int alerta = (dto.getEstado_alerta() != null && dto.getEstado_alerta() == 1) ? 1 : 0;

        if (bpm > 140 || bpm < 45 || spo2 < 90 || temp > 38.3 || temp < 34.5) {
            alerta = 1;
        }

        String gwId = dto.getGateway_id();
        String gwIp = dto.getGateway_ip();
        Long pisoId = dto.getPiso_id();
        String pisoNum = dto.getPiso_numero();
        Long sedeId = dto.getSede_id();
        String sedeNom = dto.getSede_nombre();

        if (gwIp != null && (gwId == null || pisoId == null || sedeId == null)) {
            try {
                com.access.control.model.Dispositivo d = dispositivoRepository.findByIp(gwIp);
                if (d != null) {
                    if (gwId == null) gwId = String.valueOf(d.getId());
                    if (d.getPiso() != null) {
                        if (pisoId == null) pisoId = d.getPiso().getId();
                        if (pisoNum == null) pisoNum = d.getPiso().getPiso();
                        if (d.getPiso().getSede() != null) {
                            if (sedeId == null) sedeId = d.getPiso().getSede().getId();
                            if (sedeNom == null) sedeNom = d.getPiso().getSede().getSede();
                        }
                    }
                }
            } catch (Exception ignored) {}
        }

        final int alertaFinal = alerta;
        final com.biotrack.entity.TelemetriaLectura lectura = new com.biotrack.entity.TelemetriaLectura(
            mac, bpm, spo2, temp, alertaFinal, gwId, gwIp, pisoId, pisoNum, sedeId, sedeNom
        );

        return io.smallrye.mutiny.Uni.createFrom().item(() -> {
            telemetriaMongoRepo.persist(lectura);
            return lectura;
        })
        .onItem().invoke(inserted -> {
            com.access.control.model.Cliente cliente = null;
            if (dto.getCliente_id() != null) {
                cliente = clienteRepository.findById(dto.getCliente_id());
            } else if (mac != null) {
                cliente = clienteRepository.findByCodigoInsignia(mac);
            }
            String nombreCliente = (cliente != null) ? (cliente.getNombre() + " " + (cliente.getApellido() != null ? cliente.getApellido() : "")).trim() : "Cliente Dinamico";

            String jsonWs = String.format(
                java.util.Locale.US,
                "{\"tipo\":\"TELEMETRIA\",\"id_pulsera\":\"%s\",\"cliente_id\":%s,\"cliente_nombre\":\"%s\",\"bpm\":%d,\"spo2\":%d,\"temperatura\":%.2f,\"alerta\":%b,\"estado_alerta\":%d,\"gateway_id\":%s,\"gateway_ip\":%s,\"piso_id\":%s,\"piso_numero\":%s,\"sede_id\":%s,\"sede_nombre\":%s,\"timestamp\":\"%s\"}",
                mac,
                (cliente != null ? cliente.getId() : "null"),
                nombreCliente,
                inserted.bpm,
                inserted.spo2,
                inserted.temp,
                inserted.estado_alerta == 1,
                inserted.estado_alerta,
                inserted.gateway_id != null ? ("\"" + inserted.gateway_id + "\"") : "null",
                inserted.gateway_ip != null ? ("\"" + inserted.gateway_ip + "\"") : "null",
                inserted.piso_id != null ? String.valueOf(inserted.piso_id) : "null",
                inserted.piso_numero != null ? ("\"" + inserted.piso_numero + "\"") : "null",
                inserted.sede_id != null ? String.valueOf(inserted.sede_id) : "null",
                inserted.sede_nombre != null ? ("\"" + inserted.sede_nombre + "\"") : "null",
                inserted.timestamp.toString()
            );
            vitalWs.broadcast(jsonWs);

            if (inserted.estado_alerta == 1) {
                notifWs.broadcast(String.format("{\"alerta\":true,\"tipo\":\"EMERGENCIA_BIOMEDICA\",\"dispositivo\":\"%s\",\"mensaje\":\"Signos anomalos detectados (%s)\"}",
                    mac, nombreCliente));
            }
        })
        .onItem().transform(inserted -> Response.status(Response.Status.ACCEPTED).entity(inserted).build())
        .onFailure().recoverWithItem(err -> Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(err.getMessage()).build());
    }

    @POST
    @Path("/signos-vitales")
    public io.smallrye.mutiny.Uni<Response> registrarTelemetria(com.access.control.dto.GatewayTelemetriaDTO dto) {
        return registrarGatewayTelemetria(dto);
    }
}
