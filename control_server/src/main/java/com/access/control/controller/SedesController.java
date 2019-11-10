package com.access.control.controller;

import com.access.control.model.Sede;
import com.access.control.services.SedeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;

@RestController
@RequestMapping("api/v1/")
@CrossOrigin(origins = "*")
public class SedesController {
    @Autowired
    SedeService servicioSedes;
    @GetMapping("sedes/{id}")
    public ResponseEntity<Sede> getArticleById(@PathVariable("id") Long id) {
        Sede sedes = servicioSedes.getSedeById(id);
        return new ResponseEntity<Sede>(sedes, HttpStatus.OK);
    }
    @GetMapping("sedes")
    public ResponseEntity<List<Sede>> getAllSedes() {
        List<Sede> list = servicioSedes.getListSedes();
        return new ResponseEntity<List<Sede>>(list, HttpStatus.OK);
    }
    @PostMapping("sedes")
    public ResponseEntity<Void> addSedes(@RequestBody Sede sedes, UriComponentsBuilder builder) {
        Sede flag = servicioSedes.addSede(sedes);
        if (flag.getId() == null) {
            return new ResponseEntity<Void>(HttpStatus.CONFLICT);
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(builder.path("/sedes/{id}").buildAndExpand(sedes.getId()).toUri());
        return new ResponseEntity<Void>(headers, HttpStatus.CREATED);
    }
    @PutMapping("sedes")
    public ResponseEntity<Sede> updateSedes(@RequestBody Sede sedes,@PathVariable("id") Long id) {
        sedes = servicioSedes.updateSede(sedes,id);
        return new ResponseEntity<Sede>(sedes, HttpStatus.OK);
    }
    @DeleteMapping("sedes/{id}")
    public ResponseEntity<Void> deleteSedes(@PathVariable("id") Long id) {
        if(servicioSedes.deleteSede(servicioSedes.getSedeById(id))){
            return new ResponseEntity<Void>(HttpStatus.OK);
        }
        return new ResponseEntity<Void>(HttpStatus.NO_CONTENT);
    }
}
