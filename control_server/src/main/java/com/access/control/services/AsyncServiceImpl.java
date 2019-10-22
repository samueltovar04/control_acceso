package com.access.control.services;

import com.access.control.model.Dispositivo;
import com.access.control.repository.DispositivoRepository;
import com.access.control.util.PingState;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.stereotype.Service;
import org.springframework.web.context.WebApplicationContext;

import java.util.Date;

@Service("asyncService")
@EnableAsync
public class AsyncServiceImpl implements AsyncService {
    private static final Logger logger = LoggerFactory.getLogger(AsyncServiceImpl.class);

    @Autowired
    private DispositivoRepository dispositivoRepository;
    @Override
    @Async("asynchThreadPoolTaskExecutor")
    @Scope(value = WebApplicationContext.SCOPE_SESSION, proxyMode = ScopedProxyMode.TARGET_CLASS)
    public void processPing(Dispositivo dis) throws InterruptedException {
        logger.info("async ping started: " + new Date() + " threadId:" + Thread.currentThread().getId());
        Thread.sleep(1000);
        dis.setPing(PingState.ping(dis));
        dispositivoRepository.saveAndFlush(dis);
        logger.info("async ping finished: " + new Date() + " threadId:" + Thread.currentThread().getId());
        return ;
    }
}
