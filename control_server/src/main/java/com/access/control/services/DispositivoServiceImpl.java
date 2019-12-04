package com.access.control.services;

import com.access.control.component.RestTemplateResponseErrorHandler;
import com.access.control.model.Dispositivo;
import com.access.control.repository.DispositivoRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.WebApplicationContext;

import java.io.IOException;
import java.util.*;

@Service("dispositivoServiceImpl")
public class DispositivoServiceImpl implements DispositivoService {
    private final Logger logger = LoggerFactory.getLogger(this.getClass());

    @Value("${server.local.url}")
    private String url;

    private RestTemplate restTemplate;

    @Autowired
    public DispositivoServiceImpl(RestTemplateBuilder restTemplateBuilder) {
        this.restTemplate = restTemplateBuilder
                .errorHandler(new RestTemplateResponseErrorHandler())
                .build();
    }
    public RestTemplate getRestTemplate() {
        return  this.restTemplate;
    }

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
    @Async("threadPoolTaskScheduler")
    @Scope(value = WebApplicationContext.SCOPE_SESSION, proxyMode = ScopedProxyMode.TARGET_CLASS)
    public ResponseEntity<Map<String, String>> checkFingerPrint() {
        logger.info("checkOk started thread=",Thread.currentThread().getName());
        System.out.println("checkOk started thread="+Thread.currentThread().getName());
        Map<String, String> result = new HashMap<>();
        ResponseEntity<Map<String, String>> response = new ResponseEntity<>(result,HttpStatus.ACCEPTED);
        HttpHeaders headers =  new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity requestEntity = new HttpEntity(null, headers);

        try {
            ResponseEntity<String> cantidad = getRestTemplate().exchange(url + "/checkOk", HttpMethod.GET, requestEntity, String.class);

            Thread.sleep(1000L);    //Intentional delay
            logger.info("checkOk completed: Thread=",Thread.currentThread().getName());
            System.out.println("checkOk completed thread="+Thread.currentThread().getName());
            String body = cantidad.getBody();
            ObjectMapper mapper = new ObjectMapper();
            JsonNode rootNode = mapper.readTree(body);
            if (rootNode instanceof JsonNode) {
                Map<String, String> map = (Map<String,String>) mapper.readValue(rootNode.toString(), Object.class);
                result.put("success",map.get("success"));
            }

            response = new ResponseEntity<>(result,HttpStatus.OK);

        }catch (RestClientException | IOException | InterruptedException e){
            logger.info("RestClientException=",e.getMessage(), "thead=",Thread.currentThread().getName());
            response = new ResponseEntity<>(result,HttpStatus.NO_CONTENT);
        }

        return response;
    }

    @Override
    @Async("threadPoolTaskScheduler")
    @Scope(value = WebApplicationContext.SCOPE_SESSION, proxyMode = ScopedProxyMode.TARGET_CLASS)
    public ResponseEntity<Map<String, String>> getHuella() {
        logger.info("getHuella started thread=",Thread.currentThread().getName());
        System.out.println("getHuella started thread="+Thread.currentThread().getName());
        Map<String, String> result = new HashMap<>();
        ResponseEntity<Map<String, String>> response = new ResponseEntity<>(result,HttpStatus.ACCEPTED);
        HttpHeaders headers =  new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity requestEntity = new HttpEntity(null, headers);

        try {
            ResponseEntity<String> cantidad = getRestTemplate().exchange(url + "/getHuella", HttpMethod.GET, requestEntity, String.class);

            Thread.sleep(1000L);    //Intentional delay
            logger.info("getHuella completed: Thread=",Thread.currentThread().getName());
            System.out.println("getHuella completed thread="+Thread.currentThread().getName());
            String body = cantidad.getBody();
            ObjectMapper mapper = new ObjectMapper();
            JsonNode rootNode = mapper.readTree(body);
            if (rootNode instanceof JsonNode) {
                Map<String, String> map = (Map<String,String>) mapper.readValue(rootNode.toString(), Object.class);
                result.put("minusia",map.get("minusia"));
                result.put("huella",map.get("huella"));
            }

            response = new ResponseEntity<>(result,HttpStatus.OK);

        }catch (RestClientException | IOException | InterruptedException e){
            logger.info("RestClientException=",e.getMessage(), "thead=",Thread.currentThread().getName());
            response = new ResponseEntity<>(result,HttpStatus.NO_CONTENT);
        }

        return response;
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
