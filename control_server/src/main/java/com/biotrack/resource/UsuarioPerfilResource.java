package com.biotrack.resource;

import com.biotrack.entity.TelemetriaVitalEntity;
import com.biotrack.entity.UsuarioEntity;
import com.biotrack.repository.TelemetriaVitalRepository;
import com.biotrack.repository.UsuarioRepository;
import io.smallrye.common.annotation.NonBlocking;
import io.smallrye.mutiny.Uni;
import io.smallrye.mutiny.infrastructure.Infrastructure;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import org.bson.types.ObjectId;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.*;

@Path("/api/usuarios")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UsuarioPerfilResource {

    @Inject
    UsuarioRepository usuarioRepository;

    @Inject
    TelemetriaVitalRepository telemetriaVitalRepository;

    @Inject
    JsonWebToken jwt;

    @GET
    @Path("/perfil")
    @NonBlocking
    public Uni<Response> getPerfil(@Context SecurityContext ctx, @QueryParam("id") String queryId) {
        return Uni.createFrom().item(() -> {
            // Extraer identificador: primero desde Claims JWT, luego desde SecurityContext Principal o query param de respaldo
            String userIdOrEmail = null;

            if (jwt != null && jwt.getSubject() != null && !jwt.getSubject().trim().isEmpty()) {
                userIdOrEmail = jwt.getSubject();
            } else if (jwt != null && jwt.getName() != null && !jwt.getName().trim().isEmpty()) {
                userIdOrEmail = jwt.getName();
            } else if (ctx != null && ctx.getUserPrincipal() != null) {
                userIdOrEmail = ctx.getUserPrincipal().getName();
            } else if (queryId != null && !queryId.trim().isEmpty()) {
                userIdOrEmail = queryId.trim();
            }

            if (userIdOrEmail == null) {
                return Response.status(Response.Status.UNAUTHORIZED)
                        .entity(Map.of("error", "No se detecto sesion autenticada ni token JWT valido."))
                        .build();
            }

            UsuarioEntity usuario = null;
            // Si es ObjectId de MongoDB
            if (ObjectId.isValid(userIdOrEmail)) {
                usuario = usuarioRepository.findById(new ObjectId(userIdOrEmail));
            }

            // Si no se encontro por ID o no era ObjectId, buscar por correo / upn
            if (usuario == null) {
                usuario = usuarioRepository.findByCorreo(userIdOrEmail.toLowerCase());
            }

            if (usuario == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Documento de usuario no encontrado en MongoDB."))
                        .build();
            }

            // Datos del Usuario
            Map<String, Object> usuarioData = new LinkedHashMap<>();
            usuarioData.put("id", usuario.id != null ? usuario.id.toString() : null);
            usuarioData.put("correo", usuario.correo);
            usuarioData.put("rol", usuario.rol);
            usuarioData.put("primerIngreso", usuario.primerIngreso);
            usuarioData.put("idPulseraAsignada", usuario.idPulseraAsignada);
            usuarioData.put("tieneFotograma", (usuario.fotogramaBase64 != null && !usuario.fotogramaBase64.isEmpty()));

            // Estado de Membresia
            Map<String, Object> membresiaData = new LinkedHashMap<>();
            membresiaData.put("tipo", usuario.tipoMembresia != null ? usuario.tipoMembresia : "ESTANDAR");
            membresiaData.put("estado", "ACTIVA");
            membresiaData.put("accesoTorniquete", true);

            // Alertas de Pago y Estado Financiero
            Map<String, Object> pagoData = new LinkedHashMap<>();
            pagoData.put("estadoPago", usuario.estadoPago != null ? usuario.estadoPago : "AL_DIA");
            boolean tieneAlerta = "PENDIENTE".equalsIgnoreCase(usuario.estadoPago) || "VENCIDO".equalsIgnoreCase(usuario.estadoPago);
            pagoData.put("requiereAtencion", tieneAlerta);
            pagoData.put("notificacion", tieneAlerta
                    ? "Estimado usuario, tiene un saldo pendiente en su membresia. Por favor regularice su pago."
                    : "Su suscripcion se encuentra al dia. Gracias por su puntualidad.");

            // Consulta reactiva del ultimo registro de signos vitales si tiene pulsera asignada
            Map<String, Object> signosVitalesData = new LinkedHashMap<>();
            if (usuario.idPulseraAsignada != null && !usuario.idPulseraAsignada.trim().isEmpty()) {
                String pulseraId = usuario.idPulseraAsignada.trim();
                List<TelemetriaVitalEntity> lecturas = telemetriaVitalRepository.findByPulsera(pulseraId);

                if (lecturas != null && !lecturas.isEmpty()) {
                    // Tomar la lectura mas reciente
                    TelemetriaVitalEntity ultima = lecturas.get(lecturas.size() - 1);
                    signosVitalesData.put("idPulsera", ultima.id_pulsera);
                    signosVitalesData.put("bpm", ultima.bpm);
                    signosVitalesData.put("spo2", ultima.spo2);
                    signosVitalesData.put("temp", ultima.temp);
                    signosVitalesData.put("alerta", ultima.alerta);
                    signosVitalesData.put("timestamp", ultima.timestamp != null ? ultima.timestamp.toString() : null);
                    signosVitalesData.put("estadoBrazalete", "CONECTADO_TRANSMITIENDO");
                } else {
                    signosVitalesData.put("idPulsera", pulseraId);
                    signosVitalesData.put("estadoBrazalete", "SIN_LECTURAS_RECIENTES");
                    signosVitalesData.put("bpm", 0);
                    signosVitalesData.put("spo2", 0);
                    signosVitalesData.put("temp", 0.0);
                }
            } else {
                signosVitalesData.put("estadoBrazalete", "SIN_PULSERA_ASIGNADA");
            }

            // Payload Unificado
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("usuario", usuarioData);
            payload.put("signosVitales", signosVitalesData);
            payload.put("membresia", membresiaData);
            payload.put("pagos", pagoData);

            return Response.ok(payload).build();
        }).runSubscriptionOn(Infrastructure.getDefaultWorkerPool());
    }
}
