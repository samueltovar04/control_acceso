package com.access.control.controller;

import com.access.control.model.TasaCambio;
import com.access.control.repository.TasaCambioRepository;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Path("/api/tasas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TasaResource {

    @Inject
    TasaCambioRepository tasaRepo;

    @GET
    @Path("/actual")
    public Response getTasaActual(@QueryParam("moneda") @DefaultValue("USD") String moneda) {
        Optional<TasaCambio> tasaOpt = tasaRepo.findUltimaVigente(moneda.toUpperCase(), "VES");
        if (tasaOpt.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "No existe tasa registrada para " + moneda)).build();
        }

        TasaCambio t = tasaOpt.get();
        return Response.ok(Map.of(
                "moneda", t.getMonedaOrigen(),
                "tasa", t.getValor(),
                "fecha", t.getFechaVigencia().toString(),
                "vigente", true
        )).build();
    }

    @GET
    @Path("/historico")
    public Response getHistoricoTasas(@QueryParam("moneda") String moneda) {
        var query = (moneda != null && !moneda.isBlank())
                ? tasaRepo.find("monedaOrigen = ?1 order by fechaVigencia desc, fechaCaptura desc", moneda.toUpperCase())
                : tasaRepo.find("order by fechaVigencia desc, fechaCaptura desc");
        return Response.ok(query.list()).build();
    }

    @POST
    @Path("/registrar")
    @Transactional
    public Response registrarTasa(Map<String, Object> body) {
        if (body == null || !body.containsKey("moneda") || !body.containsKey("tasa")) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "moneda y tasa son obligatorios")).build();
        }

        String moneda = body.get("moneda").toString().toUpperCase();
        BigDecimal valor = new BigDecimal(body.get("tasa").toString());
        String fuente = body.getOrDefault("fuente", "MANUAL").toString();

        LocalDate vigencia = LocalDate.now();
        if (body.containsKey("fecha") && body.get("fecha") != null) {
            String fStr = body.get("fecha").toString();
            if (fStr.length() >= 10) {
                try {
                    vigencia = LocalDate.parse(fStr.substring(0, 10));
                } catch (Exception ignored) {
                }
            }
        }

        Optional<TasaCambio> opt = tasaRepo.findPorFecha(moneda, "VES", vigencia);
        TasaCambio tasa = opt.orElseGet(TasaCambio::new);
        tasa.setMonedaOrigen(moneda);
        tasa.setMonedaDestino("VES");
        tasa.setValor(valor.setScale(4, RoundingMode.HALF_UP));
        tasa.setFechaVigencia(vigencia);
        tasa.setFechaCaptura(LocalDateTime.now());
        tasa.setOrigenCaptura(fuente);

        if (tasa.getId() == null) {
            tasaRepo.persist(tasa);
        }

        return Response.status(Response.Status.CREATED).entity(Map.of(
                "mensaje", "Tasa registrada exitosamente",
                "moneda", moneda,
                "tasa", valor,
                "vigencia", vigencia.toString()
        )).build();
    }
}
