package com.access.control.controller;

import com.access.control.dto.EmpleadoDto;
import com.access.control.model.Empleado;
import com.access.control.services.DispositivoService;
import com.access.control.services.EmpleadosService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("api/v1/")
@CrossOrigin(origins = "*")
public class EmpleadosController {
    @Autowired
    EmpleadosService servicioEmpleado;
    @Autowired
    DispositivoService dispositivoService;

    @GetMapping("empleados/{id}")
    public ResponseEntity<Empleado> getEmpleadoById(@PathVariable("id") Long id) {
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
    @PostMapping(path = "empleados",  produces = "application/json; charset=UTF-8", consumes = "application/json; charset=UTF-8")
    public ResponseEntity<Empleado> addEmpleado(@RequestBody EmpleadoDto empleado, HttpServletResponse response, HttpServletRequest request) {
        Empleado flag = servicioEmpleado.addEmpleado(empleado);
        if (flag.getId() == null) {
            return new ResponseEntity<Empleado>(HttpStatus.CONFLICT);
        }

        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest().path("/{id}")
                .buildAndExpand(empleado.getId()).toUri();

       // return ResponseEntity.created(location).build();
        return new ResponseEntity<Empleado>(flag, HttpStatus.CREATED);
    }
    @PutMapping("empleados/{id}")
    public ResponseEntity<Empleado> updateEmpleado(@RequestBody EmpleadoDto empl,@PathVariable("id") Long id) {
        Empleado empleado = servicioEmpleado.updateEmpleado(empl,id);
        if(empleado!=null){
            return new ResponseEntity<Empleado>(empleado, HttpStatus.OK);
        }
        return new ResponseEntity<Empleado>(empleado, HttpStatus.NO_CONTENT);
    }

    @PutMapping("empleados/huella1/{id}")
    public ResponseEntity<Empleado> updateEmpleadohuellas(@PathVariable("id") Long id) {

        Empleado empl = servicioEmpleado.getEmpleadoById(id);
        if(empl!=null){
            Map<String,String> huella = dispositivoService.getHuella().getBody();
            empl.setHuella1(huella.get("minusia"));
            empl.setHuella2("");

            Empleado empleado = servicioEmpleado.updateEmpleadoHuella(empl,id);
            empleado.setHuella1(huella.get("huella"));

            return new ResponseEntity<Empleado>(empleado, HttpStatus.OK);
        }
        return new ResponseEntity<Empleado>(empl, HttpStatus.NO_CONTENT);
    }

    @PutMapping("empleados/huella2/{id}")
    public ResponseEntity<Empleado> updateEmpleadohuella2(@PathVariable("id") Long id) {
        Empleado empl = servicioEmpleado.getEmpleadoById(id);
        if(empl!=null){
            Map<String,String> huella = dispositivoService.getHuella().getBody();
            empl.setHuella1("");
            empl.setHuella2(huella.get("minusia"));

            Empleado empleado = servicioEmpleado.updateEmpleadoHuella(empl,id);
            empleado.setHuella2(huella.get("huella"));

            return new ResponseEntity<Empleado>(empleado, HttpStatus.OK);
        }
        return new ResponseEntity<Empleado>(empl, HttpStatus.NO_CONTENT);
    }

    @PutMapping("empleados/pisos/{id}")
    public ResponseEntity<Empleado> updateEmpleadopisos(@RequestBody EmpleadoDto empl,@PathVariable("id") Long id) {

        Empleado empleado = servicioEmpleado.updatePisos(empl,id);
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
