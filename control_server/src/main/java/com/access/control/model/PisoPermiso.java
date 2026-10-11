package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "piso_permisos")
public class PisoPermiso extends AbstractEntity {

    @ManyToOne
    private Piso piso;

    @ManyToOne
    private Empleado empleado;

    public Piso getPiso() { return piso; }
    public void setPiso(Piso piso) { this.piso = piso; }

    public Empleado getEmpleado() { return empleado; }
    public void setEmpleado(Empleado empleado) { this.empleado = empleado; }
}
