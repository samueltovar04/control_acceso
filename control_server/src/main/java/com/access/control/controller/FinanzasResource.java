package com.access.control.controller;

import com.access.control.model.ConciliacionPago;
import com.access.control.model.Gasto;
import com.access.control.model.Pago;
import com.access.control.model.Cliente;
import com.access.control.model.SuscripcionCliente;
import com.access.control.repository.*;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.math.BigDecimal;
import java.util.*;

@Path("/api/v1/finanzas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class FinanzasResource {

    @Inject
    PagoRepository pagoRepository;

    @Inject
    ConciliacionPagoRepository conciliacionRepository;

    @Inject
    GastoRepository gastoRepository;

    @Inject
    ClienteRepository clienteRepository;

    @Inject
    SuscripcionClienteRepository suscripcionRepository;

    @Inject
    NotificacionPagoRepository notificacionPagoRepository;

    @Inject
    TasaCambioRepository tasaCambioRepository;

    @Inject
    ConfiguracionFinancieraRepository configFinancieraRepository;

    @Inject
    PromocionRepository promocionRepository;

    @GET
    @Path("/cotizacion-actual")
    public Response getCotizacionActual(@QueryParam("clienteId") Long clienteId) {
        java.util.Optional<com.access.control.model.TasaCambio> tasaOpt = tasaCambioRepository.findUltimaVigente("USD", "VES");
        if (tasaOpt.isEmpty()) {
            return Response.status(Response.Status.SERVICE_UNAVAILABLE)
                    .entity(Map.of("error", "No existe tasa de cambio registrada. Ejecute sincronizacion BCV primero.")).build();
        }
        BigDecimal tasaUsd = tasaOpt.get().getValor();

        BigDecimal precioUSD = null;
        String nombreMembresia = "Sin membresia asignada";

        if (clienteId != null) {
            Cliente cliente = clienteRepository.findById(clienteId);
            if (cliente != null && cliente.getMembresiaActual() != null && cliente.getMembresiaActual().getPrecio() != null) {
                precioUSD = cliente.getMembresiaActual().getPrecio();
                nombreMembresia = cliente.getMembresiaActual().getNombre();
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("clienteId", clienteId);
        response.put("nombreMembresia", nombreMembresia);
        response.put("precioBaseUSD", precioUSD);
        response.put("tasaBCV", tasaUsd);
        response.put("fechaVigenciaTasa", tasaOpt.get().getFechaVigencia().toString());

        if (precioUSD != null) {
            BigDecimal montoExactoVES = precioUSD.multiply(tasaUsd).setScale(2, java.math.RoundingMode.HALF_UP);
            response.put("montoCalculadoVES", montoExactoVES);
        }

        return Response.ok(response).build();
    }

    @POST
    @Path("/pagos/reportar-multimoneda")
    @Transactional
    @io.quarkus.cache.CacheInvalidateAll(cacheName = "acceso-torniquete-cache")
    public Response reportarPagoMultimoneda(com.access.control.dto.ReportePagoMultimonedaDTO dto) {
        if (dto == null || dto.getClienteId() == null || dto.getNumeroReferencia() == null) {
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", "Datos de pago incompletos")).build();
        }

        // Validacion antifraude: Unicidad de referencia bancaria por metodo
        Pago pagoExistente = pagoRepository.findByReferenciaYMetodo(dto.getMetodoPago(), dto.getNumeroReferencia());
        if (pagoExistente != null) {
            return Response.status(Response.Status.CONFLICT)
                    .entity(Map.of("error", "Este numero de referencia ya fue registrado previamente para este metodo de pago.")).build();
        }

        Cliente cliente = clienteRepository.findById(dto.getClienteId());
        if (cliente == null) {
            return Response.status(Response.Status.NOT_FOUND).entity(Map.of("error", "Cliente no encontrado")).build();
        }

        // Tasa vigente BCV para snapshot inmutable
        BigDecimal tasaAplicada = dto.getTasaBcv();
        if (tasaAplicada == null || tasaAplicada.compareTo(BigDecimal.ZERO) <= 0) {
            java.util.Optional<com.access.control.model.TasaCambio> tasaDb = tasaCambioRepository.findUltimaVigente("USD", "VES");
            if (tasaDb.isEmpty()) {
                return Response.status(Response.Status.SERVICE_UNAVAILABLE)
                        .entity(Map.of("error", "No existe tasa de cambio registrada. Ejecute sincronizacion BCV primero.")).build();
            }
            tasaAplicada = tasaDb.get().getValor();
        }

        if (dto.getMontoOriginal() == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "montoOriginal es obligatorio")).build();
        }
        BigDecimal montoOriginal = dto.getMontoOriginal();

        // Aplicacion de cupon o promocion si fue suministrado
        String notasPago = null;
        if (dto.getCodigoCupon() != null && !dto.getCodigoCupon().trim().isEmpty()) {
            com.access.control.model.Promocion promo = promocionRepository.findByCodigoActiva(dto.getCodigoCupon().trim());
            if (promo != null) {
                Date hoy = new Date();
                boolean vigente = (promo.getFechaInicio() == null || !hoy.before(promo.getFechaInicio()))
                        && (promo.getFechaFin() == null || !hoy.after(promo.getFechaFin()));
                boolean memValida = (promo.getMembresiaAplica() == null
                        || (cliente.getMembresiaActual() != null && promo.getMembresiaAplica().getId().equals(cliente.getMembresiaActual().getId())));

                if (vigente && memValida) {
                    BigDecimal desc = BigDecimal.ZERO;
                    String tipo = promo.getTipoDescuento() != null ? promo.getTipoDescuento().toUpperCase() : "PORCENTAJE";
                    BigDecimal val = promo.getValorDescuento() != null ? promo.getValorDescuento() : BigDecimal.ZERO;

                    if ("PORCENTAJE".equals(tipo)) {
                        desc = montoOriginal.multiply(val).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
                    } else if ("MONTO_FIJO".equals(tipo)) {
                        desc = val;
                    } else if ("DOS_POR_UNO".equals(tipo) || "2X1".equals(tipo)) {
                        desc = montoOriginal.multiply(new BigDecimal("0.50")).setScale(2, java.math.RoundingMode.HALF_UP);
                    }
                    if (desc.compareTo(montoOriginal) > 0) {
                        desc = montoOriginal;
                    }
                    montoOriginal = montoOriginal.subtract(desc).setScale(2, java.math.RoundingMode.HALF_UP);
                    notasPago = "Cupon aplicado: " + promo.getCodigo() + " (" + promo.getNombre() + ") Descuento: " + desc;
                }
            }
        }

        BigDecimal montoVes = dto.getMontoEquivalenteVES() != null ? dto.getMontoEquivalenteVES() : montoOriginal.multiply(tasaAplicada).setScale(2, java.math.RoundingMode.HALF_UP);

        Pago pago = new Pago();
        pago.setCliente(cliente);
        pago.setFechaPago(new Date());
        pago.setMonto(montoOriginal);
        pago.setMonedaDeclarada(dto.getMonedaDeclarada() != null ? dto.getMonedaDeclarada() : "USD");
        pago.setTasaBcvAplicada(tasaAplicada);
        pago.setMontoEquivalenteVes(montoVes);
        pago.setMetodoPago(dto.getMetodoPago() != null ? dto.getMetodoPago() : "PAGO_MOVIL");
        pago.setNumeroReferencia(dto.getNumeroReferencia());
        pago.setOrigenPago("APP_MOBILE");
        pago.setEstadoPago("PENDIENTE_CONCILIAR");
        pago.setComprobanteUrl(dto.getComprobanteUrl() != null ? dto.getComprobanteUrl() : dto.getComprobanteBase64());
        if (notasPago != null) {
            pago.setRegistradoPor(notasPago);
        }

        pagoRepository.persist(pago);

        // Regla de Negocio: Conceder acceso temporal en torniquete (PENDIENTE_CONCILIAR)
        cliente.setEstadoSuscripcion("PENDIENTE_CONCILIAR");
        cliente.setComprobantePendienteId(pago.getId());

        // Notificacion al WebSocket del Dashboard Admin
        String wsEvent = String.format("{\"evento\":\"NUEVO_PAGO_REPORTADO\",\"pagoId\":%d,\"clienteId\":%d,\"montoUSD\":%s,\"montoVES\":%s,\"referencia\":\"%s\"}",
                pago.getId(), cliente.getId(), montoOriginal, montoVes, dto.getNumeroReferencia());
        com.access.control.component.ConciliacionWebSocketEndpoint.broadcastAdmin(wsEvent);

        Map<String, Object> res = new HashMap<>();
        res.put("pagoId", pago.getId());
        res.put("estadoPago", "PENDIENTE_CONCILIAR");
        res.put("accesoTorniquete", "CONCEDIDO_TEMPORAL");
        res.put("graciaHorasRestantes", 48);
        res.put("mensaje", "Pago reportado exitosamente. Se ha concedido acceso temporal mientras el administrador concilia.");

        return Response.status(Response.Status.CREATED).entity(res).build();
    }

    @POST
    @Path("/notificacion-pago")
    @Transactional
    public Response notificarPago(com.access.control.dto.NotificacionPagoDTO dto) {
        if (dto == null) {
            return Response.status(Response.Status.BAD_REQUEST).entity("Payload inválido").build();
        }

        Pago pago = new Pago();
        if (dto.getClienteId() != null) {
            Cliente cliente = clienteRepository.findById(dto.getClienteId());
            if (cliente != null) {
                pago.setCliente(cliente);
                cliente.setEstadoSuscripcion("ACTIVA");
            }
        }
        if (dto.getMonto() == null) {
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", "monto es obligatorio")).build();
        }
        pago.setMonto(dto.getMonto());
        pago.setFechaPago(new Date());
        pago.setMetodoPago(dto.getBanco() != null ? "PAGO_MOVIL - " + dto.getBanco() : "TRANSFERENCIA");
        pago.setOrigenPago("APP_MOBILE");
        pago.setNumeroReferencia(dto.getNumeroReferencia());
        pago.setRegistradoPor("CELULAR: " + (dto.getCelular() != null ? dto.getCelular() : "") + " | CEDULA: " + (dto.getCedula() != null ? dto.getCedula() : ""));
        pago.setEstadoPago("PENDIENTE_CONCILIACION");

        pagoRepository.persist(pago);

        com.access.control.model.NotificacionPago notif = new com.access.control.model.NotificacionPago();
        notif.setCliente(pago.getCliente());
        notif.setTitulo("Notificación de Pago Recibido");
        notif.setMensaje("Pago enviado por " + dto.getMonto() + " desde " + dto.getBanco() + " (Ref: " + dto.getNumeroReferencia() + ", Cédula: " + dto.getCedula() + ", Celular: " + dto.getCelular() + ")");
        notif.setTipo("CONFIRMACION_PAGO");
        notif.setFechaEnvio(new Date());
        notificacionPagoRepository.persist(notif);

        return Response.status(Response.Status.CREATED).entity(pago).build();
    }

    // --- COBROS / PAGOS ---
    @GET
    @Path("/pagos")
    public List<Pago> getTodosPagos() {
        return pagoRepository.listAll();
    }

    @GET
    @Path("/pagos/cliente/{clienteId}")
    public List<Pago> getPagosPorCliente(@PathParam("clienteId") Long clienteId) {
        return pagoRepository.findByCliente(clienteId);
    }

    @GET
    @Path("/pagos/cliente/{clienteId}/pendientes")
    public List<Pago> getPagosPendientesPorCliente(@PathParam("clienteId") Long clienteId) {
        return pagoRepository.findPendientesPorCliente(clienteId);
    }

    @POST
    @Path("/pagos")
    @Transactional
    public Response registrarPago(Pago pago) {
        pago.setFechaPago(new Date());
        if (pago.getEstadoPago() == null) {
            pago.setEstadoPago("COMPLETADO");
        }

        // Snapshot de Tasa Oficial BCV y Monto Equivalente VES
        if (pago.getTasaBcvAplicada() == null || pago.getTasaBcvAplicada().compareTo(BigDecimal.ZERO) <= 0) {
            java.util.Optional<com.access.control.model.TasaCambio> tasaDb = tasaCambioRepository.findUltimaVigente("USD", "VES");
            if (tasaDb.isPresent()) {
                pago.setTasaBcvAplicada(tasaDb.get().getValor());
            } else {
                pago.setTasaBcvAplicada(new BigDecimal("1.0000"));
            }
        }

        if (pago.getMonto() != null) {
            if ("VES".equalsIgnoreCase(pago.getMonedaDeclarada())) {
                pago.setMontoEquivalenteVes(pago.getMonto());
            } else {
                pago.setMontoEquivalenteVes(pago.getMonto().multiply(pago.getTasaBcvAplicada()).setScale(2, java.math.RoundingMode.HALF_UP));
            }
        }

        pagoRepository.persist(pago);

        // Actualizar estatus de suscripcion y fechas de vencimiento considerando la membresia
        if (pago.getCliente() != null && pago.getCliente().getId() != null) {
            Cliente cliente = clienteRepository.findById(pago.getCliente().getId());
            if (cliente != null) {
                cliente.setEstadoSuscripcion("ACTIVA");

                int diasAgregar = 30; // valor por defecto mensual
                if (cliente.getMembresiaActual() != null && cliente.getMembresiaActual().getDuracionesDias() != null) {
                    diasAgregar = cliente.getMembresiaActual().getDuracionesDias();
                }

                java.util.Calendar cal = java.util.Calendar.getInstance();
                Date base = (cliente.getFechaVencimientoMembresia() != null && cliente.getFechaVencimientoMembresia().after(new Date()))
                        ? cliente.getFechaVencimientoMembresia() : new Date();
                cal.setTime(base);
                cal.add(java.util.Calendar.DAY_OF_MONTH, diasAgregar);

                cliente.setFechaVencimientoMembresia(cal.getTime());
                cliente.setFechaProximoCobro(cal.getTime());
                cliente.setDiasGraciaUsados(0);
                cliente.setComprobantePendienteId(null);

                // Crear o actualizar SuscripcionCliente
                SuscripcionCliente sub = suscripcionRepository.findActivaPorCliente(cliente.getId());
                if (sub == null) {
                    sub = new SuscripcionCliente();
                    sub.setCliente(cliente);
                    sub.setMembresia(cliente.getMembresiaActual());
                    sub.setFechaInicio(new Date());
                    sub.setFechaFin(cal.getTime());
                    sub.setEstado("ACTIVA");
                    suscripcionRepository.persist(sub);
                } else {
                    sub.setFechaFin(cal.getTime());
                    sub.setEstado("ACTIVA");
                }
            }
        }

        return Response.status(Response.Status.CREATED).entity(pago).build();
    }


    // --- CONCILIACION BANCARIA ---
    @GET
    @Path("/conciliacion/pendientes")
    public List<Pago> getPendientesConciliacion() {
        return pagoRepository.findPendientesConciliacion();
    }

    @POST
    @Path("/conciliacion")
    @Transactional
    public Response conciliarPago(ConciliacionPago conciliacion) {
        conciliacion.setFechaConciliacion(new Date());
        conciliacionRepository.persist(conciliacion);

        if (conciliacion.getPago() != null) {
            Pago pago = pagoRepository.findById(conciliacion.getPago().getId());
            if (pago != null) {
                boolean aprobado = "CONCILIADO".equals(conciliacion.getEstado());
                pago.setEstadoPago(aprobado ? "COMPLETADO" : "RECHAZADO");

                if (pago.getCliente() != null) {
                    Cliente cliente = clienteRepository.findById(pago.getCliente().getId());
                    if (cliente != null) {
                        if (aprobado) {
                            cliente.setEstadoSuscripcion("ACTIVA");
                            cliente.setDiasGraciaUsados(0);
                            cliente.setComprobantePendienteId(null);

                            int diasAgregar = 30;
                            if (cliente.getMembresiaActual() != null && cliente.getMembresiaActual().getDuracionesDias() != null) {
                                diasAgregar = cliente.getMembresiaActual().getDuracionesDias();
                            }

                            java.util.Calendar cal = java.util.Calendar.getInstance();
                            Date base = (cliente.getFechaVencimientoMembresia() != null && cliente.getFechaVencimientoMembresia().after(new Date()))
                                    ? cliente.getFechaVencimientoMembresia() : new Date();
                            cal.setTime(base);
                            cal.add(java.util.Calendar.DAY_OF_MONTH, diasAgregar);

                            cliente.setFechaVencimientoMembresia(cal.getTime());
                            cliente.setFechaProximoCobro(cal.getTime());

                            SuscripcionCliente sub = suscripcionRepository.findActivaPorCliente(cliente.getId());
                            if (sub != null) {
                                sub.setFechaFin(cal.getTime());
                                sub.setEstado("ACTIVA");
                            }
                        } else {
                            cliente.setEstadoSuscripcion("MOROSO");
                            cliente.setComprobantePendienteId(null);
                        }
                    }
                }
            }
        }
        return Response.status(Response.Status.CREATED).entity(conciliacion).build();
    }


    // --- LISTA DE DEUDORES / MOROSOS ---
    @GET
    @Path("/deudores")
    public List<Cliente> getListaDeudores() {
        List<Cliente> deudores = clienteRepository.findByEstadoSuscripcion("VENCIDA");
        List<Cliente> porVencer = clienteRepository.findByEstadoSuscripcion("POR_VENCER");
        List<Cliente> resultado = new ArrayList<>();
        resultado.addAll(deudores);
        resultado.addAll(porVencer);
        return resultado;
    }

    // --- GASTOS DE SUCURSAL ---
    @GET
    @Path("/gastos")
    public List<Gasto> getGastos() {
        return gastoRepository.listAll();
    }

    @POST
    @Path("/gastos")
    @Transactional
    public Response registrarGasto(Gasto gasto) {
        if (gasto.getFechaGasto() == null) {
            gasto.setFechaGasto(new Date());
        }
        gastoRepository.persist(gasto);
        return Response.status(Response.Status.CREATED).entity(gasto).build();
    }

    // --- BALANCE FINANCIERO SUCURSAL ---
    @GET
    @Path("/balance")
    public Map<String, Object> getBalanceFinanciero() {
        List<Pago> pagos = pagoRepository.listAll();
        List<Gasto> gastos = gastoRepository.listAll();

        BigDecimal totalIngresos = pagos.stream()
                .filter(p -> p.getEstadoPago() != null && 
                    ("COMPLETADO".equalsIgnoreCase(p.getEstadoPago()) || 
                     "CONCILIADO".equalsIgnoreCase(p.getEstadoPago()) || 
                     "PAGADO".equalsIgnoreCase(p.getEstadoPago())))
                .map(Pago::getMonto)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalGastos = gastos.stream()
                .map(Gasto::getMonto)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal balanceNeto = totalIngresos.subtract(totalGastos);

        Map<String, Object> balance = new HashMap<>();
        balance.put("totalIngresos", totalIngresos);
        balance.put("totalGastos", totalGastos);
        balance.put("balanceNeto", balanceNeto);
        balance.put("totalTransaccionesIngresos", pagos.size());
        balance.put("totalRegistrosGastos", gastos.size());

        return balance;
    }
}
