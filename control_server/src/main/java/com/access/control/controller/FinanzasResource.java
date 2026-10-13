package com.access.control.controller;

import com.access.control.model.ConciliacionPago;
import com.access.control.model.Gasto;
import com.access.control.model.Pago;
import com.access.control.model.Cliente;
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
        pago.setMonto(dto.getMonto() != null ? dto.getMonto() : new BigDecimal("50.00"));
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

    @POST
    @Path("/pagos")
    @Transactional
    public Response registrarPago(Pago pago) {
        pago.setFechaPago(new Date());
        if (pago.getEstadoPago() == null) {
            pago.setEstadoPago("COMPLETADO");
        }
        pagoRepository.persist(pago);

        // Actualizar estatus de suscripción si aplica
        if (pago.getCliente() != null) {
            Cliente cliente = clienteRepository.findById(pago.getCliente().getId());
            if (cliente != null) {
                cliente.setEstadoSuscripcion("ACTIVA");
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
                pago.setEstadoPago("CONCILIADO".equals(conciliacion.getEstado()) ? "COMPLETADO" : "RECHAZADO");
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
                .filter(p -> "COMPLETADO".equals(p.getEstadoPago()))
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
