package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;

import javax.persistence.*;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name="pisos")
public class  Piso extends AbstractEntity implements Serializable {

    private static final long serialVersionUID = 1L;
    private String piso;
    private String descripcion;
    private String area;

   /* @JsonIgnore
    @OneToMany(cascade = CascadeType.REMOVE,mappedBy = "pisos")
    private List<PisoPermiso> pisoPermisos = new ArrayList<>();

    public List<PisoPermiso> getPisoPermisos() {
        return pisoPermisos;
    }

    public void setPisoPermisos(List<PisoPermiso> pisoPermisos) {
        this.pisoPermisos = pisoPermisos;
    }*/

    public Piso() {
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getPiso() {
        return piso;
    }

    public void setPiso(String piso) {
        this.piso = piso;
    }

    public String getArea() {
        return area;
    }

    public void setArea(String area) {
        this.area = area;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Piso)) return false;
        Piso piso1 = (Piso) o;
        return Objects.equals(getPiso(), piso1.getPiso()) &&
                Objects.equals(getArea(), piso1.getArea());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getPiso(), getArea());
    }

    @Override
    public String toString() {
        return "Piso{" +
                "piso='" + piso + '\'' +
                ", area='" + area + '\'' +
                '}';
    }
}
