package com.access.control.controller;

import com.access.control.model.Visita;
import com.access.control.services.VisitasService;
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
public class VisitasController {
    @Autowired
    VisitasService servicioVisitas;
    @GetMapping("visitas/{id}")
    public ResponseEntity<Visita> getArticleById(@PathVariable("id") Long id) {
        Visita visitas = servicioVisitas.getVisitaById(id);
        return new ResponseEntity<Visita>(visitas, HttpStatus.OK);
    }
    @GetMapping("visitas")
    public ResponseEntity<List<Visita>> getAllVisitas() {
        List<Visita> list = servicioVisitas.getListVisitas();
        return new ResponseEntity<List<Visita>>(list, HttpStatus.OK);
    }
    @PostMapping("visitas")
    public ResponseEntity<Void> addVisitas(@RequestBody Visita visitas, UriComponentsBuilder builder) {
        Visita flag = servicioVisitas.addVisita(visitas);
        if (flag.getId() == null) {
            return new ResponseEntity<Void>(HttpStatus.CONFLICT);
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(builder.path("/visitas/{id}").buildAndExpand(visitas.getId()).toUri());
        return new ResponseEntity<Void>(headers, HttpStatus.CREATED);
    }
    @PutMapping("visitas/{id}")
    public ResponseEntity<Visita> updateVisitas(@RequestBody Visita visitas,@PathVariable("id") Long id) {
        visitas = servicioVisitas.updateVisita(visitas,id);
        return new ResponseEntity<Visita>(visitas, HttpStatus.OK);
    }
    @DeleteMapping("visitas/{id}")
    public ResponseEntity<Void> deleteVisitas(@PathVariable("id") Long id) {
        if(servicioVisitas.deleteVisita(servicioVisitas.getVisitaById(id))){
            return new ResponseEntity<Void>(HttpStatus.OK);
        }
        return new ResponseEntity<Void>(HttpStatus.NO_CONTENT);
    }
}
