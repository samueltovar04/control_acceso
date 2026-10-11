package com.access.control.schedule;

import com.access.control.model.Cliente;
import com.access.control.model.NotificacionPago;
import com.access.control.model.SuscripcionCliente;
import com.access.control.repository.ClienteRepository;
import com.access.control.repository.NotificacionPagoRepository;
import com.access.control.repository.SuscripcionClienteRepository;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
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

    @Scheduled(every = "24h")
    @Transactional
    public void verificarVencimientosYNotificar() {
        Date ahora = new Date();
        
        Calendar cal5Dias = Calendar.getInstance();
        cal5Dias.setTime(ahora);
        cal5Dias.add(Calendar.DAY_OF_MONTH, 5);

        // 1. Notificar suscripciones que vencen en 5 días
        List<SuscripcionCliente> porVencer = suscripcionRepository.findPorVencer(cal5Dias.getTime());
        for (SuscripcionCliente sub : porVencer) {
            Cliente c = sub.getCliente();
            if (c != null) {
                c.setEstadoSuscripcion("POR_VENCER");

                NotificacionPago notif = new NotificacionPago();
                notif.setCliente(c);
                notif.setTitulo("Aviso de Pago Pendiente");
                notif.setMensaje("Estimado " + c.getNombre() + ", su membresía vence el " + sub.getFechaFin() + ". Por favor realice su pago para mantener su acceso activo.");
                notif.setTipo("RECORDATORIO_VENCIMIENTO");
                notif.setFechaEnvio(ahora);
                notificacionRepository.persist(notif);
            }
        }

        // 2. Actualizar suscripciones vencidas
        List<SuscripcionCliente> vencidas = suscripcionRepository.findVencidas(ahora);
        for (SuscripcionCliente sub : vencidas) {
            sub.setEstado("VENCIDA");
            Cliente c = sub.getCliente();
            if (c != null) {
                c.setEstadoSuscripcion("VENCIDA");

                NotificacionPago notif = new NotificacionPago();
                notif.setCliente(c);
                notif.setTitulo("Membresía Vencida");
                notif.setMensaje("Estimado " + c.getNombre() + ", su membresía ha vencido. Regularice su pago en recepción o mediante la app para desbloquear su acceso.");
                notif.setTipo("AVISO_MORA");
                notif.setFechaEnvio(ahora);
                notificacionRepository.persist(notif);
            }
        }
    }
}
