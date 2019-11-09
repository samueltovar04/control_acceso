package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import javax.persistence.*;
import java.io.Serializable;

@Entity
@Table(name="piso_permiso")
@JsonIgnoreProperties("empleado")
public class PisoPermiso extends AbstractEntity implements Serializable {
    private static final long serialVersionUID = 1L;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonBackReference(value = "empleadoJson")
    @JoinColumn(name = "badge_access",referencedColumnName = "badge_access")
    private Empleado empleado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonBackReference(value = "pisoJson")
    @JoinColumn(name = "piso_id",referencedColumnName = "id")
    private Piso pisos;

    private Long pisoId;

    public Long getPisoId() {
        return pisoId;
    }

    public void setPisoId(Long pisoId) {
        this.pisoId = pisoId;
    }

    public PisoPermiso(Piso piso, Integer state){
        this.pisos=piso;
        this.setState(state);
    }

    public PisoPermiso() {
    }

    public Piso getPisos() {
        return pisos;
    }

    public void setPisos(Piso pisos) {
        this.pisos = pisos;
    }

    public Empleado getEmpleado() {
        return empleado;
    }

    public void setEmpleado(Empleado empleado) {
        this.empleado = empleado;
    }

}
