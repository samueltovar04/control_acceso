package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "tipo_contratos")
public class TipoContrato extends AbstractEntity {

    @Column(name = "contrato")
    private String contrato;

    public String getContrato() {
        return contrato;
    }

    public void setContrato(String contrato) {
        this.contrato = contrato;
    }

    public String getNombre() {
        return contrato;
    }

    public void setNombre(String nombre) {
        this.contrato = nombre;
    }
}
