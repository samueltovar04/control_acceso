package com.access.control.services;

import com.access.control.dto.EmpleadoDto;
import com.access.control.model.Empleado;

import java.util.List;

public interface EmpleadosService {
    List<Empleado> getListEmpleados(boolean picture);
    Empleado       getEmpleadoById(Long idEmpleado);
    Empleado       addEmpleado(EmpleadoDto emp);
    Empleado       updateEmpleado(EmpleadoDto emp,Long id);
    Empleado       updateEmpleadoHuella(EmpleadoDto emp,Long id);
    boolean        deleteEmpleado(Empleado emp);
    Empleado       updatePisos(EmpleadoDto emp,Long id);
}
