package com.access.control.controller;

import com.access.control.model.Piso;
import com.access.control.services.PisoService;
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
public class PisosController {
    @Autowired
    PisoService servicioPisos;
    @GetMapping("pisos/{id}")
    public ResponseEntity<Piso> getArticleById(@PathVariable("id") Long id) {
        Piso pisos = servicioPisos.getPisoById(id);
        return new ResponseEntity<Piso>(pisos, HttpStatus.OK);
    }
    @GetMapping("pisos")
    public ResponseEntity<List<Piso>> getAllPisos() {
        List<Piso> list = servicioPisos.getListPisos();
        return new ResponseEntity<List<Piso>>(list, HttpStatus.OK);
    }
    @PostMapping("pisos")
    public ResponseEntity<Void> addPisos(@RequestBody Piso pisos, UriComponentsBuilder builder) {
        Piso flag = servicioPisos.addPiso(pisos);
        if (flag.getId() == null) {
            return new ResponseEntity<Void>(HttpStatus.CONFLICT);
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(builder.path("/pisos/{id}").buildAndExpand(pisos.getId()).toUri());
        return new ResponseEntity<Void>(headers, HttpStatus.CREATED);
    }
    @PutMapping("pisos")
    public ResponseEntity<Piso> updatePisos(@RequestBody Piso pisos,@PathVariable("id") Long id) {
        pisos = servicioPisos.updatePiso(pisos,id);
        return new ResponseEntity<Piso>(pisos, HttpStatus.OK);
    }
    @DeleteMapping("pisos/{id}")
    public ResponseEntity<Void> deletePisos(@PathVariable("id") Long id) {
        if(servicioPisos.deletePiso(servicioPisos.getPisoById(id))){
            return new ResponseEntity<Void>(HttpStatus.OK);
        }
        return new ResponseEntity<Void>(HttpStatus.NO_CONTENT);
    }
}
