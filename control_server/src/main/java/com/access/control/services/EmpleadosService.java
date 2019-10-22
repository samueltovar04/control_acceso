package com.access.control.services;

import com.access.control.dto.EmpleadoDto;
import com.access.control.model.Empleado;

import java.util.List;

public interface EmpleadosService {
    List<Empleado> getListEmpleados(boolean picture);
    Empleado       getEmpleadoById(Long idEmpleado);
    Empleado       addEmpleado(EmpleadoDto emp);
    Empleado       updateEmpleado(Empleado emp,Long id);
    boolean        deleteEmpleado(Empleado emp);
    Empleado       updatePisos(Empleado emp);
}
