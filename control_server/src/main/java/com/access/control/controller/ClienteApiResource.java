package com.access.control.controller;

import com.access.control.model.Cliente;
import com.access.control.model.Membresia;
import com.access.control.repository.ClienteRepository;
import com.access.control.repository.MembresiaRepository;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Path("/api/clientes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ClienteApiResource {

    @Inject
    ClienteRepository clienteRepository;

    @Inject
    MembresiaRepository membresiaRepository;

    @Inject
    com.access.control.repository.PagoRepository pagoRepository;

    @Inject
    com.access.control.repository.PromocionRepository promocionRepository;

    @Inject
    com.access.control.repository.SuscripcionClienteRepository suscripcionRepository;

    @Inject
    com.access.control.repository.TasaCambioRepository tasaCambioRepository;

    @GET
    @Path("/validar-disponibilidad")
    public Response validarDisponibilidad(
            @QueryParam("cedula") String cedula,
            @QueryParam("correo") String correo) {

        boolean cedulaDisponible = true;
        boolean correoDisponible = true;
        String mensaje = "Datos disponibles para registro";

        if (cedula != null && !cedula.trim().isEmpty()) {
            Cliente porCedula = clienteRepository.findByDocumento(cedula.trim());
            if (porCedula != null) {
                cedulaDisponible = false;
                mensaje = "El documento/cedula ya se encuentra registrado con otro cliente";
            }
        }

        if (correo != null && !correo.trim().isEmpty()) {
            Cliente porCorreo = clienteRepository.find("email", correo.trim()).firstResult();
            if (porCorreo != null) {
                correoDisponible = false;
                mensaje = "El correo electronico ya se encuentra registrado con otro cliente";
            }
        }

        Map<String, Object> res = new HashMap<>();
        res.put("cedulaDisponible", cedulaDisponible);
        res.put("correoDisponible", correoDisponible);
        res.put("valido", cedulaDisponible && correoDisponible);
        res.put("mensaje", mensaje);

        return Response.ok(res).build();
    }

    @PUT
    @Path("/{id}/asignar-membresia")
    @Transactional
    @io.quarkus.cache.CacheInvalidateAll(cacheName = "acceso-torniquete-cache")
    public Response asignarMembresia(
            @PathParam("id") Long clienteId,
            Map<String, Object> body) {

        Cliente cliente = clienteRepository.findById(clienteId);
        if (cliente == null) {
            return Response.status(Response.Status.NOT_FOUND).entity(Map.of("error", "Cliente no encontrado")).build();
        }

        if (body == null || !body.containsKey("membresiaId")) {
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", "membresiaId es requerido")).build();
        }

        Long membresiaId = Long.valueOf(body.get("membresiaId").toString());
        Membresia membresia = membresiaRepository.findById(membresiaId);
        if (membresia == null) {
            return Response.status(Response.Status.NOT_FOUND).entity(Map.of("error", "Membresia no encontrada")).build();
        }

        cliente.setMembresiaActual(membresia);

        // Validar si se suministro codigo de cupon o promocion
        String codigoCupon = body.containsKey("codigoCupon") && body.get("codigoCupon") != null ? body.get("codigoCupon").toString().trim() : null;
        com.access.control.model.Promocion promo = null;
        BigDecimal precioBase = membresia.getPrecio() != null ? membresia.getPrecio() : BigDecimal.ZERO;
        BigDecimal descuento = BigDecimal.ZERO;
        int diasExtra = 0;
        String beneficioPromo = null;

        if (codigoCupon != null && !codigoCupon.isEmpty()) {
            promo = promocionRepository.findByCodigoActiva(codigoCupon);
            if (promo != null) {
                java.util.Date hoy = new java.util.Date();
                boolean vigente = (promo.getFechaInicio() == null || !hoy.before(promo.getFechaInicio()))
                               && (promo.getFechaFin() == null || !hoy.after(promo.getFechaFin()));
                boolean aplicaMembresia = promo.getMembresiaAplica() == null || promo.getMembresiaAplica().getId().equals(membresia.getId());

                if (vigente && aplicaMembresia) {
                    String tipoPromo = promo.getTipoDescuento() != null ? promo.getTipoDescuento().toUpperCase() : "PORCENTAJE";
                    BigDecimal valDesc = promo.getValorDescuento() != null ? promo.getValorDescuento() : BigDecimal.ZERO;

                    if ("PORCENTAJE".equals(tipoPromo)) {
                        descuento = precioBase.multiply(valDesc).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
                    } else if ("MONTO_FIJO".equals(tipoPromo)) {
                        descuento = valDesc;
                    } else if ("DOS_POR_UNO".equals(tipoPromo) || "2X1".equals(tipoPromo)) {
                        descuento = precioBase.multiply(new BigDecimal("0.50")).setScale(2, java.math.RoundingMode.HALF_UP);
                        beneficioPromo = "Promocion 2x1 aplicada";
                    } else if ("DIAS_EXTRA".equals(tipoPromo) || "MESES_EXTRA".equals(tipoPromo)) {
                        diasExtra = valDesc.intValue();
                        beneficioPromo = "+" + diasExtra + " dias de membresia de obsequio";
                    }
                }
            }
        }

        if (descuento.compareTo(precioBase) > 0) {
            descuento = precioBase;
        }
        BigDecimal montoFinalUSD = precioBase.subtract(descuento).setScale(2, java.math.RoundingMode.HALF_UP);
        if (montoFinalUSD.compareTo(BigDecimal.ZERO) < 0) {
            montoFinalUSD = BigDecimal.ZERO.setScale(2, java.math.RoundingMode.HALF_UP);
        }

        // Calcular duracion en dias
        int dias = (membresia.getDuracionDias() != null && membresia.getDuracionDias() > 0) ? membresia.getDuracionDias() : 30;
        dias += diasExtra;

        java.util.Calendar cal = java.util.Calendar.getInstance();
        java.util.Date baseFecha = (cliente.getFechaVencimientoMembresia() != null && cliente.getFechaVencimientoMembresia().after(new java.util.Date()))
                ? cliente.getFechaVencimientoMembresia() : new java.util.Date();
        cal.setTime(baseFecha);
        cal.add(java.util.Calendar.DAY_OF_MONTH, dias);
        java.util.Date fechaLimite = cal.getTime();

        cliente.setFechaVencimientoMembresia(fechaLimite);
        cliente.setFechaProximoCobro(fechaLimite);
        cliente.setDiasGraciaUsados(0);
        cliente.setComprobantePendienteId(null);

        String nuevoEstado = body.containsKey("estadoSuscripcion") ? body.get("estadoSuscripcion").toString() : "ACTIVA";
        cliente.setEstadoSuscripcion(nuevoEstado);

        clienteRepository.persist(cliente);

        // Crear o actualizar suscripcion recurrente
        com.access.control.model.SuscripcionCliente suscripcion = suscripcionRepository.findActivaPorCliente(cliente.getId());
        if (suscripcion == null) {
            suscripcion = new com.access.control.model.SuscripcionCliente();
            suscripcion.setCliente(cliente);
            suscripcion.setMembresia(membresia);
            suscripcion.setFechaInicio(new java.util.Date());
            suscripcion.setFechaFin(fechaLimite);
            suscripcion.setEstado(nuevoEstado);
            suscripcion.setRenovacionAutomatica(Boolean.TRUE.equals(cliente.getAutoRenovar()));
            suscripcionRepository.persist(suscripcion);
        } else {
            suscripcion.setMembresia(membresia);
            suscripcion.setFechaFin(fechaLimite);
            suscripcion.setEstado(nuevoEstado);
            suscripcion.setRenovacionAutomatica(Boolean.TRUE.equals(cliente.getAutoRenovar()));
        }

        // Generar registro de Pago de apertura/asignacion si no esta explicitamente desactivado
        boolean generarPago = !body.containsKey("registrarPago") || Boolean.parseBoolean(body.get("registrarPago").toString());
        com.access.control.model.Pago nuevoPago = null;
        if (generarPago) {
            nuevoPago = new com.access.control.model.Pago();
            nuevoPago.setCliente(cliente);
            nuevoPago.setSuscripcion(suscripcion);
            nuevoPago.setSede(cliente.getSede());
            nuevoPago.setMonto(montoFinalUSD);
            nuevoPago.setFechaPago(new java.util.Date());
            nuevoPago.setMonedaDeclarada("USD");

            // Obtener tasa BCV actual
            java.util.Optional<com.access.control.model.TasaCambio> tasaOpt = tasaCambioRepository.findUltimaVigente("USD", "VES");
            if (tasaOpt.isPresent()) {
                BigDecimal valorTasa = tasaOpt.get().getValor();
                nuevoPago.setTasaBcvAplicada(valorTasa);
                nuevoPago.setMontoEquivalenteVes(montoFinalUSD.multiply(valorTasa).setScale(2, java.math.RoundingMode.HALF_UP));
            } else {
                nuevoPago.setTasaBcvAplicada(new BigDecimal("1.0000"));
                nuevoPago.setMontoEquivalenteVes(montoFinalUSD);
            }

            String metodo = body.containsKey("metodoPago") ? body.get("metodoPago").toString() : "EFECTIVO";
            nuevoPago.setMetodoPago(metodo);
            nuevoPago.setOrigenPago("WEB_ADMIN");
            nuevoPago.setRegistradoPor("ADMIN_ASIGNACION_MEMBRESIA");
            nuevoPago.setNumeroReferencia(body.containsKey("numeroReferencia") ? body.get("numeroReferencia").toString() : ("ASIG-" + System.currentTimeMillis()));
            nuevoPago.setEstadoPago("COMPLETADO");

            pagoRepository.persist(nuevoPago);
        }

        Map<String, Object> res = new HashMap<>();
        res.put("clienteId", cliente.getId());
        res.put("membresiaId", membresia.getId());
        res.put("membresiaNombre", membresia.getNombre());
        res.put("precioBaseUSD", precioBase);
        res.put("descuentoUSD", descuento);
        res.put("montoCobradoUSD", montoFinalUSD);
        res.put("cuponAplicado", promo != null ? promo.getCodigo() : null);
        res.put("beneficioPromo", beneficioPromo);
        res.put("fechaVencimiento", fechaLimite);
        res.put("estadoSuscripcion", cliente.getEstadoSuscripcion());
        res.put("pagoId", nuevoPago != null ? nuevoPago.getId() : null);
        res.put("mensaje", "Membresia asignada exitosamente al cliente con pago generado y vigencia actualizada.");

        return Response.ok(res).build();
    }

    @POST
    @Path("/registro")
    @Transactional
    public Response registrarClienteDesdeApp(Map<String, Object> body) {
        if (body == null || !body.containsKey("documento") || !body.containsKey("email")) {
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", "documento y email son obligatorios")).build();
        }

        String documento = body.get("documento").toString().trim();
        String email = body.get("email").toString().trim();

        if (clienteRepository.findByDocumento(documento) != null) {
            return Response.status(Response.Status.CONFLICT).entity(Map.of("error", "La cedula ya se encuentra registrada")).build();
        }

        Cliente nuevo = new Cliente();
        nuevo.setDocumento(documento);
        nuevo.setEmail(email);
        nuevo.setNombre(body.containsKey("nombre") ? body.get("nombre").toString() : "Cliente");
        nuevo.setApellido(body.containsKey("apellido") ? body.get("apellido").toString() : "");
        nuevo.setTelefono(body.containsKey("telefono") ? body.get("telefono").toString() : "");
        nuevo.setEstadoSuscripcion("PENDIENTE_PAGO");
        nuevo.setQrTokenDinamico("QR-APP-" + documento + "-" + System.currentTimeMillis());

        if (body.containsKey("faceVector")) {
            nuevo.setFaceVector(body.get("faceVector").toString());
        }

        if (body.containsKey("membresiaId")) {
            Long memId = Long.valueOf(body.get("membresiaId").toString());
            Membresia m = membresiaRepository.findById(memId);
            if (m != null) {
                nuevo.setMembresiaActual(m);
            }
        }

        clienteRepository.persist(nuevo);

        BigDecimal montoUSD = nuevo.getMembresiaActual() != null && nuevo.getMembresiaActual().getPrecio() != null ?
                nuevo.getMembresiaActual().getPrecio() : null;

        Map<String, Object> res = new HashMap<>();
        res.put("clienteId", nuevo.getId());
        res.put("estado", "ACTIVO");
        res.put("estadoMembresia", nuevo.getEstadoSuscripcion());
        res.put("montoPagarUSD", montoUSD);
        res.put("qrToken", nuevo.getQrTokenDinamico());
        res.put("mensaje", "Cliente registrado exitosamente. Proceda a reportar el comprobante de pago.");

        return Response.status(Response.Status.CREATED).entity(res).build();
    }
}
