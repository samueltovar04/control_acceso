package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.Date;

@Entity
@Table(name = "gastos")
public class Gasto extends AbstractEntity {

    private String descripcion;
    private String categoria; // MANTENIMIENTO, SERVICIOS, SUMINISTROS, PERSONAL, EQUIPAMIENTO
    private BigDecimal monto;

    @Temporal(TemporalType.DATE)
    private Date fechaGasto;

    private String registradoPor;

    @ManyToOne
    private Sede sede;

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }

    public Date getFechaGasto() {
        return fechaGasto;
    }

    public void setFechaGasto(Date fechaGasto) {
        this.fechaGasto = fechaGasto;
    }

    public String getRegistradoPor() {
        return registradoPor;
    }

    public void setRegistradoPor(String registradoPor) {
        this.registradoPor = registradoPor;
    }

    public Sede getSede() {
        return sede;
    }

    public void setSede(Sede sede) {
        this.sede = sede;
    }
}
