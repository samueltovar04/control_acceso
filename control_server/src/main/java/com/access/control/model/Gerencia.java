package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "gerencias")
public class Gerencia extends AbstractEntity {

    @Column(name = "gerencia")
    private String gerencia;

    public String getGerencia() {
        return gerencia;
    }

    public void setGerencia(String gerencia) {
        this.gerencia = gerencia;
    }

    public String getNombre() {
        return gerencia;
    }

    public void setNombre(String nombre) {
        this.gerencia = nombre;
    }
}
