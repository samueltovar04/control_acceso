package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "dispositivos")
public class Dispositivo extends AbstractEntity {

    private String ip;
    private String nombre;
    private String tipo; // TORNIQUETE, PUERTA_ACCESO, LECTOR_FACIAL, LECTOR_HUELLA
    private String ubicacion;
    private Boolean estadoConexion = true;

    @ManyToOne
    private Sede sede;

    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getUbicacion() {
        return ubicacion;
    }

    public void setUbicacion(String ubicacion) {
        this.ubicacion = ubicacion;
    }

    public Boolean getEstadoConexion() {
        return estadoConexion;
    }

    public void setEstadoConexion(Boolean estadoConexion) {
        this.estadoConexion = estadoConexion;
    }

    public Sede getSede() {
        return sede;
    }

    public void setSede(Sede sede) {
        this.sede = sede;
    }
}
