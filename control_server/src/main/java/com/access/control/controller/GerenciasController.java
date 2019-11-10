package com.access.control.controller;

import com.access.control.model.Gerencia;
import com.access.control.services.GerenciaService;
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
public class GerenciasController {
    @Autowired
    GerenciaService servicioGerencias;
    @GetMapping("gerencias/{id}")
    public ResponseEntity<Gerencia> getArticleById(@PathVariable("id") Long id) {
        Gerencia gerencias = servicioGerencias.getGerenciaById(id);
        return new ResponseEntity<Gerencia>(gerencias, HttpStatus.OK);
    }
    @GetMapping("gerencias")
    public ResponseEntity<List<Gerencia>> getAllGerencias() {
        List<Gerencia> list = servicioGerencias.getListGerencias();
        return new ResponseEntity<List<Gerencia>>(list, HttpStatus.OK);
    }
    @PostMapping("gerencias")
    public ResponseEntity<Void> addGerencias(@RequestBody Gerencia gerencias, UriComponentsBuilder builder) {
        Gerencia flag = servicioGerencias.addGerencia(gerencias);
        if (flag.getId() == null) {
            return new ResponseEntity<Void>(HttpStatus.CONFLICT);
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(builder.path("/gerencias/{id}").buildAndExpand(gerencias.getId()).toUri());
        return new ResponseEntity<Void>(headers, HttpStatus.CREATED);
    }
    @PutMapping("gerencias")
    public ResponseEntity<Gerencia> updateGerencias(@RequestBody Gerencia gerencias,@PathVariable("id") Long id) {
        gerencias = servicioGerencias.updateGerencia(gerencias,id);
        return new ResponseEntity<Gerencia>(gerencias, HttpStatus.OK);
    }
    @DeleteMapping("gerencias/{id}")
    public ResponseEntity<Void> deleteGerencias(@PathVariable("id") Long id) {
        if(servicioGerencias.deleteGerencia(servicioGerencias.getGerenciaById(id))){
            return new ResponseEntity<Void>(HttpStatus.OK);
        }
        return new ResponseEntity<Void>(HttpStatus.NO_CONTENT);
    }
}
