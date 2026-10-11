package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "pisos")
public class Piso extends AbstractEntity {

    private String numeroPiso;
    private String descripcion;

    @ManyToOne
    private Sede sede;

    public String getNumeroPiso() {
        return numeroPiso;
    }

    public void setNumeroPiso(String numeroPiso) {
        this.numeroPiso = numeroPiso;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Sede getSede() {
        return sede;
    }

    public void setSede(Sede sede) {
        this.sede = sede;
    }
}
