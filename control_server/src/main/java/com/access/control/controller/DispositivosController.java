package com.access.control.controller;

import com.access.control.model.Dispositivo;
import com.access.control.services.DispositivoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;

@RestController
@RequestMapping("api/v1/")
@CrossOrigin(origins = "*")
public class DispositivosController {
    @Autowired
    DispositivoService servicioDispositivos;
    @Autowired
    private SimpMessagingTemplate template;

    @GetMapping("dispositivos/{id}")
    public ResponseEntity<Dispositivo> getArticleById(@PathVariable("id") Long id) {
        Dispositivo dispositivos = servicioDispositivos.getDispositivoById(id);
        return new ResponseEntity<Dispositivo>(dispositivos, HttpStatus.OK);
    }
    @GetMapping("dispositivos")
    public ResponseEntity<List<Dispositivo>> getAllDispositivos() {
        List<Dispositivo> list = servicioDispositivos.getListDispositivos();
        return new ResponseEntity<List<Dispositivo>>(list, HttpStatus.OK);
    }
    @PostMapping("dispositivos")
    public ResponseEntity<Void> addDispositivos(@RequestBody Dispositivo dispositivos, UriComponentsBuilder builder) {
        Dispositivo flag = servicioDispositivos.addDispositivo(dispositivos);
        if (flag.getId() == null) {
            return new ResponseEntity<Void>(HttpStatus.CONFLICT);
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(builder.path("/dispositivos/{id}").buildAndExpand(dispositivos.getId()).toUri());
        return new ResponseEntity<Void>(headers, HttpStatus.CREATED);
    }
    @PutMapping("dispositivos/{id}")
    public ResponseEntity<Dispositivo> updateDispositivos(@RequestBody Dispositivo dispositivos,@PathVariable("id") Long id) {
        dispositivos = servicioDispositivos.updateDispositivo(dispositivos,id);
        return new ResponseEntity<Dispositivo>(dispositivos, HttpStatus.OK);
    }
    @DeleteMapping("dispositivos/{id}")
    public ResponseEntity<Void> deleteDispositivos(@PathVariable("id") Long id) {
        if(servicioDispositivos.deleteDispositivo(servicioDispositivos.getDispositivoById(id))){
            return new ResponseEntity<Void>(HttpStatus.OK);
        }
        return new ResponseEntity<Void>(HttpStatus.NO_CONTENT);
    }

    @MessageMapping("/dispositivos")
    @SendTo("/dispositivos")
    public List<Dispositivo> returnDispositivos(List<Dispositivo> dispositivos,SimpMessageHeaderAccessor headerAccessor){
        return dispositivos;
    }

    @MessageMapping("/cliente/dispositivos")
    @SendTo("/cliente/dispositivos")
    public void returnDispositivo(SimpMessageHeaderAccessor headerAccessor, WebSocketSession session) {
        ResponseEntity<List<Dispositivo>> respnse = this.servicioDispositivos.getListDispositivosActivos();
        this.template.convertAndSend("/cliente/dispositivos", respnse);
        return;
    }
}
