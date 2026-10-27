package com.access.control.schedule;

import com.access.control.model.Cliente;
import com.access.control.model.NotificacionPago;
import com.access.control.model.Pago;
import com.access.control.repository.ClienteRepository;
import com.access.control.repository.NotificacionPagoRepository;
import com.access.control.repository.PagoRepository;
import com.access.control.repository.PromocionRepository;
import io.quarkus.cache.CacheInvalidateAll;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;

@ApplicationScoped
public class MembershipExpirationWorker {

    private static final Logger LOG = Logger.getLogger(MembershipExpirationWorker.class);

    @Inject
    ClienteRepository clienteRepo;

    @Inject
    PagoRepository pagoRepo;

    @Inject
    NotificacionPagoRepository notificacionRepo;

    @Inject
    PromocionRepository promocionRepo;

    @Inject
    com.access.control.repository.SuscripcionClienteRepository suscripcionRepo;

    @Inject
    com.access.control.repository.TasaCambioRepository tasaCambioRepo;

    /**
     * Evaluacion diaria a la medianoche (00:01 AM)
     */
    @Scheduled(cron = "0 1 0 * * ?", identity = "membership-expiration-evaluator")
    @Transactional
    @CacheInvalidateAll(cacheName = "acceso-torniquete-cache")
    public void evaluarVencimientosYMorosidad() {
        Date ahora = new Date();
        LOG.infof("Ejecutando evaluacion automatica de vencimientos a fecha: %s", ahora);

        // 1. Clientes cuya fecha de vencimiento ya paso y requieren corte de facturacion y nuevo pago
        List<Cliente> vencidos = clienteRepo.findVencidosParaMora(ahora);
        for (Cliente c : vencidos) {
            boolean estabaActivo = "ACTIVA".equals(c.getEstadoSuscripcion()) || "POR_VENCER".equals(c.getEstadoSuscripcion());
            c.setEstadoSuscripcion("MOROSO");

            Long memId = (c.getMembresiaActual() != null) ? c.getMembresiaActual().getId() : null;
            String promoTexto = "";
            List<com.access.control.model.Promocion> promos = promocionRepo.findVigentesPorMembresia(memId);
            if (!promos.isEmpty()) {
                com.access.control.model.Promocion p = promos.get(0);
                promoTexto = " Descuento de reactivacion: use el cupon " + p.getCodigo() + " (" + p.getNombre() + ").";
            }

            // Generacion automatica de cobro al corte SI Y SOLO SI el cliente tiene membresia asignada y estaba activo
            boolean tieneMembresiaValida = c.getMembresiaActual() != null && c.getMembresiaActual().getId() != null;

            if (estabaActivo && tieneMembresiaValida) {
                com.access.control.model.SuscripcionCliente sub = suscripcionRepo.findActivaPorCliente(c.getId());
                if (sub != null) {
                    sub.setEstado("VENCIDA");
                }

                java.math.BigDecimal precioBaseUSD = c.getMembresiaActual().getPrecio() != null ? c.getMembresiaActual().getPrecio() : java.math.BigDecimal.ZERO;
                java.math.BigDecimal descuentoUSD = java.math.BigDecimal.ZERO;

                // Verificar si hay cupon o promocion vigente aplicable a la membresia para el nuevo corte
                if (!promos.isEmpty()) {
                    com.access.control.model.Promocion promoActiva = promos.get(0);
                    String tipoPromo = promoActiva.getTipoDescuento() != null ? promoActiva.getTipoDescuento().toUpperCase() : "PORCENTAJE";
                    java.math.BigDecimal valDesc = promoActiva.getValorDescuento() != null ? promoActiva.getValorDescuento() : java.math.BigDecimal.ZERO;

                    if ("PORCENTAJE".equals(tipoPromo)) {
                        descuentoUSD = precioBaseUSD.multiply(valDesc).divide(new java.math.BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
                    } else if ("MONTO_FIJO".equals(tipoPromo)) {
                        descuentoUSD = valDesc;
                    } else if ("DOS_POR_UNO".equals(tipoPromo) || "2X1".equals(tipoPromo)) {
                        descuentoUSD = precioBaseUSD.multiply(new java.math.BigDecimal("0.50")).setScale(2, java.math.RoundingMode.HALF_UP);
                    }
                }

                if (descuentoUSD.compareTo(precioBaseUSD) > 0) {
                    descuentoUSD = precioBaseUSD;
                }
                java.math.BigDecimal montoCuotaUSD = precioBaseUSD.subtract(descuentoUSD).setScale(2, java.math.RoundingMode.HALF_UP);
                
                // Evitar duplicar pago pendiente para el mismo cliente en la misma fecha
                List<Pago> pagosCliente = pagoRepo.findByCliente(c.getId());
                boolean pagoPendienteExiste = pagosCliente.stream().anyMatch(pg -> "PENDIENTE_PAGO".equals(pg.getEstadoPago()) || "PENDIENTE_CONCILIACION".equals(pg.getEstadoPago()));

                if (!pagoPendienteExiste && montoCuotaUSD.compareTo(java.math.BigDecimal.ZERO) >= 0) {
                    Pago nuevoCobroCorte = new Pago();
                    nuevoCobroCorte.setCliente(c);
                    nuevoCobroCorte.setSuscripcion(sub);
                    nuevoCobroCorte.setSede(c.getSede());
                    nuevoCobroCorte.setMonto(montoCuotaUSD);
                    nuevoCobroCorte.setFechaPago(ahora);
                    nuevoCobroCorte.setMonedaDeclarada("USD");

                    java.util.Optional<com.access.control.model.TasaCambio> tasaOpt = tasaCambioRepo.findUltimaVigente("USD", "VES");
                    if (tasaOpt.isPresent()) {
                        java.math.BigDecimal tBcv = tasaOpt.get().getValor();
                        nuevoCobroCorte.setTasaBcvAplicada(tBcv);
                        nuevoCobroCorte.setMontoEquivalenteVes(montoCuotaUSD.multiply(tBcv).setScale(2, java.math.RoundingMode.HALF_UP));
                    } else {
                        nuevoCobroCorte.setTasaBcvAplicada(new java.math.BigDecimal("1.0000"));
                        nuevoCobroCorte.setMontoEquivalenteVes(montoCuotaUSD);
                    }

                    nuevoCobroCorte.setMetodoPago("CORTE_AUTOMATICO");
                    nuevoCobroCorte.setOrigenPago("SISTEMA_CRON_VENCIMIENTOS");
                    nuevoCobroCorte.setRegistradoPor("SCHEDULER_RENOVACION");
                    nuevoCobroCorte.setNumeroReferencia("CORTE-" + c.getId() + "-" + System.currentTimeMillis());
                    nuevoCobroCorte.setEstadoPago("PENDIENTE_PAGO");
                    pagoRepo.persist(nuevoCobroCorte);
                }
            } else if (!tieneMembresiaValida) {
                // Si el cliente no posee membresia, su estado se consolida en SIN_MEMBRESIA y NO se genera pago
                c.setEstadoSuscripcion("SIN_MEMBRESIA");
            }

            NotificacionPago notif = new NotificacionPago();
            notif.setCliente(c);
            notif.setTitulo(tieneMembresiaValida ? "Membresia Vencida - Corte de Pago Generado" : "Cliente Sin Membresia Activa");
            notif.setMensaje(tieneMembresiaValida 
                ? ("Estimado " + c.getNombre() + ", su corte de membresia ha vencido." + promoTexto + " Se ha generado su cuota de pago pendiente. Regularice su pago en recepcion o web para reactivar su paso en torniquetes.")
                : ("Estimado " + c.getNombre() + ", no posee membresia activa asignada. Su acceso a torniquetes permanece bloqueado."));
            notif.setTipo("AVISO_MORA");
            notif.setFechaEnvio(ahora);
            notificacionRepo.persist(notif);
        }


        // 2. Evaluacion de clientes en PENDIENTE_CONCILIAR que superaron el periodo de gracia (48h)
        List<Cliente> enGracia = clienteRepo.findPendientesConciliacion();
        for (Cliente c : enGracia) {
            if (c.getComprobantePendienteId() != null) {
                Pago p = pagoRepo.findById(c.getComprobantePendienteId());
                if (p != null && p.getFechaPago() != null) {
                    long diasTranscurridos = ChronoUnit.DAYS.between(p.getFechaPago().toInstant(), ahora.toInstant());
                    if (diasTranscurridos >= 2) {
                        c.setEstadoSuscripcion("MOROSO");
                        c.setDiasGraciaUsados((c.getDiasGraciaUsados() != null ? c.getDiasGraciaUsados() : 0) + 1);

                        NotificacionPago notif = new NotificacionPago();
                        notif.setCliente(c);
                        notif.setTitulo("Periodo de Gracia Expirado");
                        notif.setMensaje("Su comprobante de pago reportado supero el tiempo maximo de 48 horas sin validacion bancaria. El pase temporal en torniquete ha sido suspendido.");
                        notif.setTipo("GRACIA_EXPIRADA");
                        notif.setFechaEnvio(ahora);
                        notificacionRepo.persist(notif);

                        LOG.warnf("Cliente %s supero las 48h de gracia en PENDIENTE_CONCILIAR. Bloqueando acceso.", c.getDocumento());
                    }
                }
            }
        }

        // 3. Evaluacion de cancelaciones programadas al vencer la membresia pagada
        List<Cliente> cancelaciones = clienteRepo.findCancelacionesProgramadasVencidas(ahora);
        for (Cliente c : cancelaciones) {
            c.setMembresiaActual(null);
            c.setEstadoSuscripcion("SIN_MEMBRESIA");

            NotificacionPago notif = new NotificacionPago();
            notif.setCliente(c);
            notif.setTitulo("Cancelacion Programada Efectiva");
            notif.setMensaje("Estimado " + c.getNombre() + ", su periodo de membresia ha finalizado. La auto-renovacion estaba desactivada, por lo que su membresia ha sido removida y el acceso en torniquetes ha sido bloqueado.");
            notif.setTipo("CANCELACION_EFECTIVA");
            notif.setFechaEnvio(ahora);
            notificacionRepo.persist(notif);

            LOG.info("Cancelacion programada ejecutada para cliente " + c.getDocumento() + ". Membresia removida.");
        }

        LOG.info("Evaluacion de membresias finalizada. Cache de torniquetes invalidada.");
    }
}
