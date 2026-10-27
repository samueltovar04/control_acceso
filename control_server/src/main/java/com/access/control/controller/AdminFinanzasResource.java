package com.access.control.controller;

import com.access.control.component.ConciliacionWebSocketEndpoint;
import com.access.control.model.Cliente;
import com.access.control.model.Pago;
import com.access.control.model.TasaCambio;
import com.access.control.repository.ClienteRepository;
import com.access.control.repository.PagoRepository;
import com.access.control.repository.TasaCambioRepository;
import io.quarkus.cache.CacheInvalidateAll;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Path("/api/admin")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AdminFinanzasResource {

    @Inject
    PagoRepository pagoRepo;

    @Inject
    ClienteRepository clienteRepo;

    @Inject
    TasaCambioRepository tasaRepo;

    @Inject
    com.access.control.schedule.BcvRateScraperWorker bcvWorker;

    @POST
    @Path("/tasa-bcv/sincronizar")
    public Response sincronizarTasaManual() {
        Map<String, Object> res = bcvWorker.sincronizarTasasOficiales();
        return Response.ok(res).build();
    }

    @POST
    @Path("/pagos/registrar-directo")
    @Transactional
    @CacheInvalidateAll(cacheName = "acceso-torniquete-cache")
    public Response registrarPagoDirectoCaja(Map<String, Object> body) {
        if (body == null || !body.containsKey("clienteId") || !body.containsKey("monto")) {
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", "clienteId y monto son requeridos")).build();
        }

        Long clienteId = Long.valueOf(body.get("clienteId").toString());
        BigDecimal monto = new BigDecimal(body.get("monto").toString());
        String metodoPago = body.containsKey("metodoPago") ? body.get("metodoPago").toString() : "EFECTIVO_USD";
        String monedaDeclarada = body.containsKey("monedaDeclarada") ? body.get("monedaDeclarada").toString() : "USD";
        String registradoPor = body.containsKey("registradoPor") ? body.get("registradoPor").toString() : "Admin Caja";

        Cliente c = clienteRepo.findById(clienteId);
        if (c == null) {
            return Response.status(Response.Status.NOT_FOUND).entity(Map.of("error", "Cliente no encontrado")).build();
        }

        java.util.Optional<TasaCambio> tasaOpt = tasaRepo.findUltimaVigente("USD", "VES");
        if (tasaOpt.isEmpty()) {
            return Response.status(Response.Status.SERVICE_UNAVAILABLE)
                    .entity(Map.of("error", "No existe tasa de cambio registrada. Ejecute sincronizacion BCV primero.")).build();
        }
        BigDecimal tasaUsd = tasaOpt.get().getValor();

        BigDecimal montoVes = "VES".equalsIgnoreCase(monedaDeclarada) ? monto : monto.multiply(tasaUsd).setScale(2, RoundingMode.HALF_UP);

        Pago pago = new Pago();
        pago.setCliente(c);
        pago.setMonto(monto);
        pago.setMonedaDeclarada(monedaDeclarada);
        pago.setTasaBcvAplicada(tasaUsd);
        pago.setMontoEquivalenteVes(montoVes);
        pago.setMetodoPago(metodoPago);
        pago.setOrigenPago("ADMIN_MANUAL");
        pago.setRegistradoPor(registradoPor);
        pago.setFechaPago(new Date());
        pago.setEstadoPago("PAGADO");
        pago.setNumeroReferencia("CAJA-" + System.currentTimeMillis());

        pagoRepo.persist(pago);

        // Prorrogar vigencia 30 dias
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.DAY_OF_MONTH, 30);
        Date nuevoVencimiento = cal.getTime();

        c.setEstadoSuscripcion("ACTIVA");
        c.setFechaVencimientoMembresia(nuevoVencimiento);
        c.setFechaProximoCobro(nuevoVencimiento);
        c.setComprobantePendienteId(null);

        Map<String, Object> res = new HashMap<>();
        res.put("pagoId", pago.getId());
        res.put("estadoPago", "PAGADO");
        res.put("nuevoVencimiento", nuevoVencimiento);
        res.put("accesoTorniquete", "HABILITADO");
        res.put("mensaje", "Pago directo registrado con exito en caja. Membresia activada por 30 dias.");

        return Response.ok(res).build();
    }

    @PUT
    @Path("/pagos/{id}/conciliar")
    @Transactional
    @CacheInvalidateAll(cacheName = "acceso-torniquete-cache")
    public Response conciliarPago(@PathParam("id") Long pagoId, Map<String, Object> body) {
        Pago pago = pagoRepo.findById(pagoId);
        if (pago == null) {
            return Response.status(Response.Status.NOT_FOUND).entity(Map.of("error", "Pago no encontrado")).build();
        }

        Long usuarioId = body != null && body.containsKey("usuarioConciliaId") ? Long.valueOf(body.get("usuarioConciliaId").toString()) : 1L;
        pago.setEstadoPago("CONCILIADO");
        pago.setUsuarioConciliaId(usuarioId);
        pago.setFechaConciliacion(new Date());

        Cliente cliente = pago.getCliente();
        Date nuevaFechaVencimiento = new Date();

        if (cliente != null) {
            Calendar cal = Calendar.getInstance();
            cal.add(Calendar.DAY_OF_MONTH, 30);
            nuevaFechaVencimiento = cal.getTime();

            cliente.setEstadoSuscripcion("ACTIVA");
            cliente.setFechaVencimientoMembresia(nuevaFechaVencimiento);
            cliente.setFechaProximoCobro(nuevaFechaVencimiento);
            cliente.setComprobantePendienteId(null);

            // Notificar a la app cliente en tiempo real
            String clientePayload = String.format("{\"evento\":\"PAGO_CONCILIADO\",\"pagoId\":%d,\"nuevoEstado\":\"ACTIVA\",\"nuevaFechaVencimiento\":\"%s\"}",
                    pago.getId(), nuevaFechaVencimiento);
            ConciliacionWebSocketEndpoint.notificarCliente(cliente.getId(), clientePayload);
        }

        // Notificar broadcast a otros administradores
        String adminPayload = String.format("{\"evento\":\"PAGO_CONCILIADO_ADMIN\",\"pagoId\":%d,\"conciliadoPor\":%d}", pago.getId(), usuarioId);
        ConciliacionWebSocketEndpoint.broadcastAdmin(adminPayload);

        Map<String, Object> res = new HashMap<>();
        res.put("pagoId", pago.getId());
        res.put("estado", "CONCILIADO");
        res.put("clienteId", cliente != null ? cliente.getId() : null);
        res.put("nuevaFechaVencimiento", nuevaFechaVencimiento);
        res.put("notificacionWebSocketDespachada", true);

        return Response.ok(res).build();
    }

    @PUT
    @Path("/pagos/{id}/rechazar")
    @Transactional
    @CacheInvalidateAll(cacheName = "acceso-torniquete-cache")
    public Response rechazarPago(@PathParam("id") Long pagoId, Map<String, Object> body) {
        Pago pago = pagoRepo.findById(pagoId);
        if (pago == null) {
            return Response.status(Response.Status.NOT_FOUND).entity(Map.of("error", "Pago no encontrado")).build();
        }

        String motivo = body != null && body.containsKey("motivo") ? body.get("motivo").toString() : "Comprobante no coincide con extracto bancario";
        pago.setEstadoPago("RECHAZADO");
        pago.setMotivoRechazo(motivo);
        pago.setFechaConciliacion(new Date());

        Cliente cliente = pago.getCliente();
        if (cliente != null) {
            cliente.setEstadoSuscripcion("MOROSO");
            cliente.setComprobantePendienteId(null);

            // Notificar a la app cliente en tiempo real
            String clientePayload = String.format("{\"evento\":\"PAGO_RECHAZADO\",\"pagoId\":%d,\"nuevoEstado\":\"MOROSO\",\"motivoRechazo\":\"%s\"}",
                    pago.getId(), motivo.replace("\"", "\\\""));
            ConciliacionWebSocketEndpoint.notificarCliente(cliente.getId(), clientePayload);
        }

        // Notificar broadcast a otros administradores
        String adminPayload = String.format("{\"evento\":\"PAGO_RECHAZADO_ADMIN\",\"pagoId\":%d,\"motivo\":\"%s\"}",
                pago.getId(), motivo.replace("\"", "\\\""));
        ConciliacionWebSocketEndpoint.broadcastAdmin(adminPayload);

        Map<String, Object> res = new HashMap<>();
        res.put("pagoId", pago.getId());
        res.put("estado", "RECHAZADO");
        res.put("estadoMembresia", "MOROSO");
        res.put("accesoTorniquete", "BLOQUEADO_INMEDIATO");
        res.put("motivo", motivo);

        return Response.ok(res).build();
    }

    @GET
    @Path("/dashboard/metricas")
    public Response getMetricasDashboard() {
        java.util.Optional<TasaCambio> tasaOpt = tasaRepo.findUltimaVigente("USD", "VES");
        BigDecimal tasaActiva = tasaOpt.map(TasaCambio::getValor).orElse(null);

        List<Pago> pagosCompletados = pagoRepo.list("estadoPago in ('PAGADO', 'CONCILIADO', 'COMPLETADO')");
        BigDecimal totalUSD = pagosCompletados.stream()
                .map(Pago::getMonto)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalVES = tasaActiva != null ? totalUSD.multiply(tasaActiva).setScale(2, RoundingMode.HALF_UP) : null;

        long alDia = clienteRepo.count("estadoSuscripcion in ('ACTIVA', 'PAGADO')");
        long porConciliar = pagoRepo.count("estadoPago in ('PENDIENTE_CONCILIAR', 'PENDIENTE_CONCILIACION')");
        long morosos = clienteRepo.count("estadoSuscripcion in ('MOROSO', 'VENCIDA')");

        Map<String, Object> kpis = new HashMap<>();
        kpis.put("recaudadoMesUSD", totalUSD);
        kpis.put("recaudadoMesVES", totalVES);
        kpis.put("tasaActiva", tasaActiva);
        kpis.put("clientesAlDia", alDia);
        kpis.put("clientesPendienteConciliar", porConciliar);
        kpis.put("clientesMorosos", morosos);

        return Response.ok(kpis).build();
    }

    @GET
    @Path("/reportes/financiero")
    public Response getReporteFinanciero(@QueryParam("periodo") @DefaultValue("mensual") String periodo) {
        List<Pago> todos = pagoRepo.listAll();
        List<Map<String, Object>> filas = new ArrayList<>();

        for (Pago p : todos) {
            Map<String, Object> fila = new HashMap<>();
            fila.put("pagoId", p.getId());
            fila.put("cliente", p.getCliente() != null ? (p.getCliente().getNombre() + " " + p.getCliente().getApellido()) : "Anonimo");
            fila.put("cedula", p.getCliente() != null ? p.getCliente().getDocumento() : "N/A");
            fila.put("fecha", p.getFechaPago());
            fila.put("montoUSD", p.getMonto());
            fila.put("montoVES", p.getMontoEquivalenteVes());
            fila.put("tasa", p.getTasaBcvAplicada());
            fila.put("metodo", p.getMetodoPago());
            fila.put("referencia", p.getNumeroReferencia());
            fila.put("estado", p.getEstadoPago());
            filas.add(fila);
        }

        Map<String, Object> reporte = new HashMap<>();
        reporte.put("periodo", periodo);
        reporte.put("totalRegistros", filas.size());
        reporte.put("transacciones", filas);

        return Response.ok(reporte).build();
    }
}
