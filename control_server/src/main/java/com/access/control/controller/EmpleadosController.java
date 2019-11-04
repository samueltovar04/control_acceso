package com.access.control.controller;


import com.access.control.dto.EmpleadoDto;
import com.access.control.model.Empleado;
import com.access.control.services.EmpleadosService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("api/v1/")
@CrossOrigin(origins = "*")
public class EmpleadosController {
    @Autowired
    EmpleadosService servicioEmpleado;
    @GetMapping("empleados/{id}")
    public ResponseEntity<Empleado> getArticleById(@PathVariable("id") Long id) {
        Empleado empleado = servicioEmpleado.getEmpleadoById(id);
        if(empleado!=null){
            return new ResponseEntity<Empleado>(empleado, HttpStatus.OK);
        }
        return new ResponseEntity<Empleado>(empleado, HttpStatus.NO_CONTENT);
    }
    @GetMapping("empleados")
    public ResponseEntity<List<Empleado>> getAllEmpleados() {
        List<Empleado> list = servicioEmpleado.getListEmpleados(true);
        if(list!= null && list.size()>0){
            return new ResponseEntity<List<Empleado>>(list, HttpStatus.OK);
        }
        return new ResponseEntity<List<Empleado>>(list, HttpStatus.NO_CONTENT);
    }
    @PostMapping("empleados")
    public ResponseEntity<Empleado> addEmpleado(@RequestBody EmpleadoDto empleado) {
        Empleado flag = servicioEmpleado.addEmpleado(empleado);
        if (flag.getId() == null) {
            return new ResponseEntity<Empleado>(HttpStatus.CONFLICT);
        }
        //UriComponentsBuilder builder;
        //HttpHeaders headers = new HttpHeaders();
        //headers.setLocation(builder.path("api/v1/empleados/{id}").buildAndExpand(empleado.getId()).toUri());

        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest().path("/{id}")
                .buildAndExpand(empleado.getId()).toUri();

        return ResponseEntity.created(location).build();
        //return new ResponseEntity<Empleado>(flag, HttpStatus.CREATED);
    }
    @PutMapping("empleados/{id}")
    public ResponseEntity<Empleado> updateEmpleado(@RequestBody EmpleadoDto empl,@PathVariable("id") Long id) {
        Empleado empleado = servicioEmpleado.updateEmpleado(empl,id);
        if(empleado!=null){
            return new ResponseEntity<Empleado>(empleado, HttpStatus.OK);
        }
        return new ResponseEntity<Empleado>(empleado, HttpStatus.NO_CONTENT);
    }

    @PutMapping("empleados/huellas/{id}")
    public ResponseEntity<Empleado> updateEmpleadohuellas(@RequestBody Empleado empl,@PathVariable("id") Long id) {

        Empleado empleado = servicioEmpleado.updateEmpleadoHuella(empl,id);
        if(empleado!=null){
            return new ResponseEntity<Empleado>(empleado, HttpStatus.OK);
        }
        return new ResponseEntity<Empleado>(empleado, HttpStatus.NO_CONTENT);
    }

    @PutMapping("empleados/pisos/{id}")
    public ResponseEntity<Empleado> updateEmpleadopisos(@RequestBody Empleado empl,@PathVariable("id") Long id) {

        Empleado empleado = servicioEmpleado.updatePisos(empl);
        if(empleado!=null){
            return new ResponseEntity<Empleado>(empleado, HttpStatus.OK);
        }
        return new ResponseEntity<Empleado>(empleado, HttpStatus.NO_CONTENT);
    }

    @DeleteMapping("empleados/{id}")
    public ResponseEntity<Void> deleteEmpleado(@PathVariable("id") Long id) {
        if(servicioEmpleado.deleteEmpleado(servicioEmpleado.getEmpleadoById(id))){
            return new ResponseEntity<Void>(HttpStatus.OK);
        }
        return new ResponseEntity<Void>(HttpStatus.NO_CONTENT);
    }
}
