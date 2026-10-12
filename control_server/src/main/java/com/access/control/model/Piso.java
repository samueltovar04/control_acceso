package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "pisos")
public class Piso extends AbstractEntity {

    @Column(name = "piso")
    private String piso;

    @Column(name = "descripcion")
    private String descripcion;

    @Column(name = "area")
    private String area;

    @ManyToOne
    @JoinColumn(name = "sede_id")
    private Sede sede;

    @Transient
    private Long sedeId;

    public String getPiso() {
        return piso;
    }

    public void setPiso(String piso) {
        this.piso = piso;
    }

    public String getNumeroPiso() {
        return piso;
    }

    public void setNumeroPiso(String numeroPiso) {
        this.piso = numeroPiso;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getArea() {
        return area;
    }

    public void setArea(String area) {
        this.area = area;
    }

    public Sede getSede() {
        return sede;
    }

    public void setSede(Sede sede) {
        this.sede = sede;
    }

    public Long getSedeId() {
        return sede != null ? sede.getId() : sedeId;
    }

    public void setSedeId(Long sedeId) {
        this.sedeId = sedeId;
    }
}
