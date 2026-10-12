package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "sedes")
public class Sede extends AbstractEntity {

    @Column(name = "sede")
    private String sede;

    public String getSede() {
        return sede;
    }

    public void setSede(String sede) {
        this.sede = sede;
    }

    public String getNombre() {
        return sede;
    }

    public void setNombre(String nombre) {
        this.sede = nombre;
    }
}
