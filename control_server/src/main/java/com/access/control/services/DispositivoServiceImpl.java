package com.access.control.services;

import com.access.control.model.Dispositivo;
import com.access.control.repository.DispositivoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service("dispositivoServiceImpl")
public class DispositivoServiceImpl implements DispositivoService {
    private final Logger logger = LoggerFactory.getLogger(this.getClass());
    @Autowired
    DispositivoRepository dao;

    @Override
    @Transactional
    public List<Dispositivo> getListDispositivos() {
        return (List<Dispositivo>) dao.findAll();
    }

    @Override
    @Transactional
    public List<Dispositivo> findAllEnabled() {
        return dao.findAllDispositivosEnabled(1);
    }

    @Override
    @Transactional
    public Optional<Dispositivo> findById(Long id) {
        Optional<Dispositivo> p = dao.findById(id);
        return p;
    }

    @Override
    @Transactional
    public Dispositivo getDispositivoById(Long id) {
        return findById(id).orElse(null);
    }

    @Override
    @Transactional
    public Dispositivo getOneDispositivo(Long id) {
        return dao.getOne(id);
    }

    @Override
    @Transactional
    public Dispositivo addDispositivo(Dispositivo stock) {
        return dao.save(stock);
    }

    @Override
    @Transactional
    public Dispositivo updateDispositivo(Dispositivo dispositivo, Long id) {
        if(dao.existsById(id)){
            return dao.save(dispositivo);
        }else{
            return null;
        }
    }

    @Override
    @Transactional
    public Dispositivo saveDispositivo(Dispositivo dispositivo) {
            return dao.saveAndFlush(dispositivo);
    }

    @Override
    @Transactional
    public Boolean deleteById(Long id) {
        dao.deleteById(id);
        return dao.existsById(id);
    }

    @Override
    @Transactional
    public Boolean deleteDispositivo(Dispositivo obj) {
        dao.delete(obj);
        return dao.existsById(obj.getId());
    }

    @Override
    @Transactional
    @Async("threadPoolTaskScheduler")
    @Scope(value = WebApplicationContext.SCOPE_SESSION, proxyMode = ScopedProxyMode.TARGET_CLASS)
    public ResponseEntity<List<Dispositivo>> getListDispositivosActivos() {
        logger.info("async ping started: " + new Date() + " threadId:" + Thread.currentThread().getName());
        ResponseEntity<List<Dispositivo>> response = new ResponseEntity<>(null, HttpStatus.ACCEPTED);
        List<Dispositivo> list = new ArrayList<>();

        try {
            list = dao.findAllDispositivosEnabled(1);
            Thread.sleep(1000L);
        } catch (InterruptedException e) {
            e.getMessage();
            response = new ResponseEntity<>(list,HttpStatus.NO_CONTENT);
        }
        if(list!=null){
            response = new ResponseEntity<List<Dispositivo>>(list, HttpStatus.OK);
        }
        else{
            response = new ResponseEntity<>(list,HttpStatus.NO_CONTENT);
        }
        logger.info("async ping finished: " + new Date() + " threadId:" + Thread.currentThread().getName());
        return response;
    }
}
