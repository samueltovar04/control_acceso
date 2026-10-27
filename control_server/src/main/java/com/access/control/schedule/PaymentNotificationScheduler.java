package com.access.control.schedule;

import com.access.control.model.Cliente;
import com.access.control.model.NotificacionPago;
import com.access.control.model.Promocion;
import com.access.control.model.SuscripcionCliente;
import com.access.control.repository.ClienteRepository;
import com.access.control.repository.NotificacionPagoRepository;
import com.access.control.repository.PromocionRepository;
import com.access.control.repository.SuscripcionClienteRepository;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

@ApplicationScoped
public class PaymentNotificationScheduler {

    @Inject
    SuscripcionClienteRepository suscripcionRepository;

    @Inject
    NotificacionPagoRepository notificacionRepository;

    @Inject
    ClienteRepository clienteRepository;

    @Inject
    PromocionRepository promocionRepository;

    @Scheduled(every = "24h")
    @Transactional
    public void verificarVencimientosYNotificar() {
        Date ahora = new Date();
        
        Calendar cal5Dias = Calendar.getInstance();
        cal5Dias.setTime(ahora);
        cal5Dias.add(Calendar.DAY_OF_MONTH, 5);

        // 1. Notificar suscripciones que vencen en 5 dias con promociones aplicables
        List<SuscripcionCliente> porVencer = suscripcionRepository.findPorVencer(cal5Dias.getTime());
        for (SuscripcionCliente sub : porVencer) {
            Cliente c = sub.getCliente();
            if (c != null) {
                c.setEstadoSuscripcion("POR_VENCER");

                Long membresiaId = (sub.getMembresia() != null) ? sub.getMembresia().getId() : 
                                   (c.getMembresiaActual() != null ? c.getMembresiaActual().getId() : null);
                
                String promoMsg = "";
                List<Promocion> promos = promocionRepository.findVigentesPorMembresia(membresiaId);
                if (!promos.isEmpty()) {
                    Promocion p = promos.get(0);
                    promoMsg = " Promo disponible: Use el cupon " + p.getCodigo() + " para obtener beneficio de " + p.getNombre() + " al renovar.";
                }

                NotificacionPago notif = new NotificacionPago();
                notif.setCliente(c);
                notif.setTitulo("Aviso de Pago Pendiente");
                notif.setMensaje("Estimado " + c.getNombre() + ", su membresia vence el " + sub.getFechaFin() + "." + promoMsg + " Regularice su pago para mantener su acceso activo.");
                notif.setTipo("RECORDATORIO_VENCIMIENTO");
                notif.setFechaEnvio(ahora);
                notificacionRepository.persist(notif);
            }
        }

        // 2. Actualizar suscripciones vencidas con promocion especial de reactivacion
        List<SuscripcionCliente> vencidas = suscripcionRepository.findVencidas(ahora);
        for (SuscripcionCliente sub : vencidas) {
            sub.setEstado("VENCIDA");
            Cliente c = sub.getCliente();
            if (c != null) {
                c.setEstadoSuscripcion("VENCIDA");

                Long membresiaId = (sub.getMembresia() != null) ? sub.getMembresia().getId() : 
                                   (c.getMembresiaActual() != null ? c.getMembresiaActual().getId() : null);

                String promoReactivacion = "";
                List<Promocion> promos = promocionRepository.findVigentesPorMembresia(membresiaId);
                if (!promos.isEmpty()) {
                    Promocion p = promos.get(0);
                    promoReactivacion = " Reactivese hoy con el cupon " + p.getCodigo() + " y disfrute de " + p.getNombre() + ".";
                }

                NotificacionPago notif = new NotificacionPago();
                notif.setCliente(c);
                notif.setTitulo("Membresia Vencida");
                notif.setMensaje("Estimado " + c.getNombre() + ", su membresia ha vencido. " + promoReactivacion + " Regularice su pago para desbloquear su acceso.");
                notif.setTipo("AVISO_MORA");
                notif.setFechaEnvio(ahora);
                notificacionRepository.persist(notif);
            }
        }
    }
}

