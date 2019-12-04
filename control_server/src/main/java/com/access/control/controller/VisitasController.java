package com.access.control.controller;

import com.access.control.dto.VisitaDto;
import com.access.control.model.Visita;
import com.access.control.services.DispositivoService;
import com.access.control.services.VisitasService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("api/v1/")
@CrossOrigin(origins = "*")
public class VisitasController {
    @Autowired
    VisitasService servicioVisitas;
    @Autowired
    DispositivoService dispositivoService;
    @GetMapping("visitantes/{id}")
    public ResponseEntity<Visita> getArticleById(@PathVariable("id") Long id) {
        Visita visitas = servicioVisitas.getVisitaById(id);
        return new ResponseEntity<Visita>(visitas, HttpStatus.OK);
    }
    @GetMapping("visitantes")
    public ResponseEntity<List<Visita>> getAllVisitas() {
        List<Visita> list = servicioVisitas.getListVisitas();
        return new ResponseEntity<List<Visita>>(list, HttpStatus.OK);
    }
    @PostMapping("visitantes")
    public ResponseEntity<Void> addVisitas(@RequestBody VisitaDto visitas, UriComponentsBuilder builder) {
        Visita flag = servicioVisitas.addVisita(visitas);
        if (flag.getId() == null) {
            return new ResponseEntity<Void>(HttpStatus.CONFLICT);
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(builder.path("/visitantes/{id}").buildAndExpand(visitas.getId()).toUri());
        return new ResponseEntity<Void>(headers, HttpStatus.CREATED);
    }
    @PutMapping("visitantes/{id}")
    public ResponseEntity<Visita> updateVisitas(@RequestBody VisitaDto visitantes,@PathVariable("id") Long id) {
        Visita visitas = servicioVisitas.updateVisita(visitantes,id);
        return new ResponseEntity<Visita>(visitas, HttpStatus.OK);
    }
    @PutMapping("visitantes/huella1/{id}")
    public ResponseEntity<Visita> updateVisitahuellas(@PathVariable("id") Long id) {

        Visita empl = servicioVisitas.getVisitaById(id);
        if(empl!=null){
            Map<String,String> huella = dispositivoService.getHuella().getBody();
            empl.setHuella1(huella.get("minusia"));

            Visita empleado = servicioVisitas.updateVisitaHuella(empl,id);
            empleado.setHuella1(huella.get("huella"));

            return new ResponseEntity<Visita>(empleado, HttpStatus.OK);
        }
        return new ResponseEntity<Visita>(empl, HttpStatus.NO_CONTENT);
    }

    @PutMapping("visitantes/huella2/{id}")
    public ResponseEntity<Visita> updateVisitahuella2(@PathVariable("id") Long id) {
        Visita empl = servicioVisitas.getVisitaById(id);
        if(empl!=null){
            Map<String,String> huella = dispositivoService.getHuella().getBody();
            empl.setHuella2(huella.get("minusia"));

            Visita empleado = servicioVisitas.updateVisitaHuella(empl,id);
            empleado.setHuella2(huella.get("huella"));

            return new ResponseEntity<Visita>(empleado, HttpStatus.OK);
        }
        return new ResponseEntity<Visita>(empl, HttpStatus.NO_CONTENT);
    }

    @PutMapping("visitantes/pisos/{id}")
    public ResponseEntity<Visita> updateVisitasPisos(@RequestBody VisitaDto visitantes,@PathVariable("id") Long id) {
        Visita visitas = servicioVisitas.updatePisos(visitantes,id);
        return new ResponseEntity<Visita>(visitas, HttpStatus.OK);
    }

    @DeleteMapping("visitantes/{id}")
    public ResponseEntity<Void> deleteVisitas(@PathVariable("id") Long id) {
        if(servicioVisitas.deleteVisita(servicioVisitas.getVisitaById(id))){
            return new ResponseEntity<Void>(HttpStatus.OK);
        }
        return new ResponseEntity<Void>(HttpStatus.NO_CONTENT);
    }
}
