package com.access.control.services;

import com.access.control.dto.EmpleadoDto;
import com.access.control.model.Empleado;
import java.util.List;

public interface EmpleadosService {
    Empleado getEmpleadoById(Long id);
    List<Empleado> getListEmpleados(boolean activeOnly);
    Empleado addEmpleado(EmpleadoDto empleadoDto);
    Empleado updateEmpleado(EmpleadoDto empleadoDto, Long id);
    Empleado updateEmpleadoHuella(Empleado empleado, Long id);
    Empleado updatePisos(EmpleadoDto empleadoDto, Long id);
    boolean deleteEmpleado(Empleado empleado);
}
