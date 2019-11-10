package com.access.control.controller;

import com.access.control.model.TipoContrato;
import com.access.control.services.TipoContratoService;
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
public class TipoContratosController {
    @Autowired
    TipoContratoService servicioTipoContratos;

    @GetMapping("tipoContratos/{id}")
    public ResponseEntity<TipoContrato> getArticleById(@PathVariable("id") Long id) {
        TipoContrato tipoContratos = servicioTipoContratos.getTipoContratoById(id);
        return new ResponseEntity<TipoContrato>(tipoContratos, HttpStatus.OK);
    }

    @GetMapping("tipoContratos")
    public ResponseEntity<List<TipoContrato>> getAllTipoContratos() {
        List<TipoContrato> list = servicioTipoContratos.getListTipoContratos();
        return new ResponseEntity<List<TipoContrato>>(list, HttpStatus.OK);
    }

    @PostMapping("tipoContratos")
    public ResponseEntity<Void> addTipoContratos(@RequestBody TipoContrato tipoContratos, UriComponentsBuilder builder) {
        TipoContrato flag = servicioTipoContratos.addTipoContrato(tipoContratos);
        if (flag.getId() == null) {
            return new ResponseEntity<Void>(HttpStatus.CONFLICT);
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(builder.path("/tipoContratos/{id}").buildAndExpand(tipoContratos.getId()).toUri());
        return new ResponseEntity<Void>(headers, HttpStatus.CREATED);
    }

    @PutMapping("tipoContratos")
    public ResponseEntity<TipoContrato> updateTipoContratos(@RequestBody TipoContrato tipoContratos, @PathVariable("id") Long id) {
        tipoContratos = servicioTipoContratos.updateTipoContrato(tipoContratos, id);
        return new ResponseEntity<TipoContrato>(tipoContratos, HttpStatus.OK);
    }

    @DeleteMapping("tipoContratos/{id}")
    public ResponseEntity<Void> deleteTipoContratos(@PathVariable("id") Long id) {
        if (servicioTipoContratos.deleteTipoContrato(servicioTipoContratos.getTipoContratoById(id))) {
            return new ResponseEntity<Void>(HttpStatus.OK);
        }
        return new ResponseEntity<Void>(HttpStatus.NO_CONTENT);
    }
}
