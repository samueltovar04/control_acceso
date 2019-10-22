package com.access.control.schedule;

import com.access.control.component.WebSocketEventListener;
import com.access.control.model.Dispositivo;
import com.access.control.services.AsyncService;
import com.access.control.services.DispositivoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Component
@EnableScheduling
@EnableCaching
public class ScheduledUpdatesOnTopic {
    private final Logger logger = LoggerFactory.getLogger(this.getClass());

    @Autowired
    private SimpMessagingTemplate template;
    @Autowired
    private AsyncService disService;
    @Autowired
    WebSocketEventListener webSocketEventListener;
    @Autowired
    private DispositivoService dispositivoService;


    @Scheduled(fixedRate = 20000)
    public void processPing() throws InterruptedException, IOException {
        logger.info("processPing: started: " + new Date());
        dispositivoService.findAllEnabled().forEach(dispositivo -> {
            try {
                    disService.processPing(dispositivo);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        );

        logger.info("processPing: finished: " + new Date());
    }

    @Scheduled(fixedRate = 30000)
    public void returnDispositivos() throws InterruptedException  {
        List<Dispositivo> respnse = this.dispositivoService.getListDispositivos();
        this.template.convertAndSend("/cliente/dispositivos", respnse);
    }
}
