package com.access.control.schedule;

import com.access.control.component.DispositivosWebSocketEndpoint;
import com.access.control.model.Dispositivo;
import com.access.control.services.DispositivoService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;
import java.util.List;

@ApplicationScoped
public class ScheduledUpdatesOnTopic {

    private static final Logger LOG = Logger.getLogger(ScheduledUpdatesOnTopic.class);

    @Inject
    DispositivoService dispositivoService;

    @Inject
    DispositivosWebSocketEndpoint webSocketEndpoint;

    @Inject
    ObjectMapper objectMapper;

    @Scheduled(every = "20s")
    public void processPing() {
        try {
            List<Dispositivo> dispositivos = dispositivoService.pingAllDispositivos();
            String json = objectMapper.writeValueAsString(dispositivos);
            webSocketEndpoint.broadcast(json);
            LOG.info("Escaneo programado de ping completado y transmitido via WebSocket");
        } catch (Exception e) {
            LOG.warn("Error en escaneo programado de dispositivos: " + e.getMessage());
        }
    }
}
