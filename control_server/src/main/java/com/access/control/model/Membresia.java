package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "membresias")
public class Membresia extends AbstractEntity {

    private String nombre;
    private String descripcion;
    private String periodicidad; // SEMANAL, MENSUAL, TRIMESTRAL, SEMESTRAL, ANUAL
    private Integer duracionesDias;
    private BigDecimal precio;
    private Boolean activo = true;

    @ManyToMany(fetch = FetchType.LAZY)
    private List<Piso> pisosPermitidos;

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getPeriodicidad() {
        return periodicidad;
    }

    public void setPeriodicidad(String periodicidad) {
        this.periodicidad = periodicidad;
    }

    public Integer getDuracionesDias() {
        return duracionesDias;
    }

    public void setDuracionesDias(Integer duracionesDias) {
        this.duracionesDias = duracionesDias;
    }

    public BigDecimal getPrecio() {
        return precio;
    }

    public void setPrecio(BigDecimal precio) {
        this.precio = precio;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public List<Piso> getPisosPermitidos() {
        return pisosPermitidos;
    }

    public void setPisosPermitidos(List<Piso> pisosPermitidos) {
        this.pisosPermitidos = pisosPermitidos;
    }
}
