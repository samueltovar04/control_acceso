package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "dispositivos")
public class Dispositivo extends AbstractEntity {

    @Column(name = "descripcion")
    private String descripcion;

    @Column(name = "entrada_salida")
    private Integer entradaSalida;

    @Column(name = "ip")
    private String ip;

    @Column(name = "ping")
    private Boolean ping = true;

    @Column(name = "port")
    private Integer port = 80;

    @Column(name = "tipo_dispositivo")
    private String tipoDispositivo;

    @Column(name = "sistema_operativo")
    private String sistemaOperativo;

    @ManyToOne
    @JoinColumn(name = "piso_id")
    private Piso piso;

    @Transient
    private Long pisoId;

    public Long getPisoId() {
        if (pisoId != null) return pisoId;
        return (piso != null) ? piso.getId() : null;
    }

    public void setPisoId(Long pisoId) {
        this.pisoId = pisoId;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Integer getEntradaSalida() {
        return entradaSalida;
    }

    public void setEntradaSalida(Integer entradaSalida) {
        this.entradaSalida = entradaSalida;
    }

    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }

    public Boolean getPing() {
        return ping;
    }

    public void setPing(Boolean ping) {
        this.ping = ping;
    }

    public Integer getPort() {
        return port;
    }

    public void setPort(Integer port) {
        this.port = port;
    }

    public Piso getPiso() {
        return piso;
    }

    public void setPiso(Piso piso) {
        this.piso = piso;
    }

    public String getNombre() {
        return descripcion;
    }

    public void setNombre(String nombre) {
        this.descripcion = nombre;
    }

    public Boolean getEstadoConexion() {
        return ping;
    }

    public void setEstadoConexion(Boolean estadoConexion) {
        this.ping = estadoConexion;
    }

    public String getTipoDispositivo() {
        return tipoDispositivo;
    }

    public void setTipoDispositivo(String tipoDispositivo) {
        this.tipoDispositivo = tipoDispositivo;
    }

    public String getSistemaOperativo() {
        return sistemaOperativo;
    }

    public void setSistemaOperativo(String sistemaOperativo) {
        this.sistemaOperativo = sistemaOperativo;
    }

    public String getTipo() {
        return tipoDispositivo != null ? tipoDispositivo : "TORNIQUETE";
    }

    public void setTipo(String tipo) {
        this.tipoDispositivo = tipo;
    }

    public String getUbicacion() {
        return piso != null ? piso.getPiso() : "General";
    }

    public void setUbicacion(String ubicacion) {
    }

    public String getColor() {
        return (ping != null && ping) ? "verde" : "rojo";
    }
}
