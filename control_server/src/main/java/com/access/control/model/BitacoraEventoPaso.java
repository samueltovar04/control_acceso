package com.access.control.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;
import java.util.Date;

@MongoEntity(collection = "bitacora_eventos_paso")
public class BitacoraEventoPaso extends PanacheMongoEntity {

    private String hora;
    private String mensaje;
    private String tipo; // 'success' | 'danger' | 'info'
    private Boolean concedido;
    private String personaNombre;
    private String metodo;
    private Long sedeId;
    private String sedeNombre;
    private Long dispositivoId;
    private String dispositivoNombre;
    private Date fechaHora = new Date();

    public BitacoraEventoPaso() {
    }

    public String getIdString() {
        return id != null ? id.toString() : null;
    }

    public String getHora() {
        return hora;
    }

    public void setHora(String hora) {
        this.hora = hora;
    }

    public String getMensaje() {
        return mensaje;
    }

    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public Boolean getConcedido() {
        return concedido;
    }

    public void setConcedido(Boolean concedido) {
        this.concedido = concedido;
    }

    public String getPersonaNombre() {
        return personaNombre;
    }

    public void setPersonaNombre(String personaNombre) {
        this.personaNombre = personaNombre;
    }

    public String getMetodo() {
        return metodo;
    }

    public void setMetodo(String metodo) {
        this.metodo = metodo;
    }

    public Long getSedeId() {
        return sedeId;
    }

    public void setSedeId(Long sedeId) {
        this.sedeId = sedeId;
    }

    public String getSedeNombre() {
        return sedeNombre;
    }

    public void setSedeNombre(String sedeNombre) {
        this.sedeNombre = sedeNombre;
    }

    public Long getDispositivoId() {
        return dispositivoId;
    }

    public void setDispositivoId(Long dispositivoId) {
        this.dispositivoId = dispositivoId;
    }

    public String getDispositivoNombre() {
        return dispositivoNombre;
    }

    public void setDispositivoNombre(String dispositivoNombre) {
        this.dispositivoNombre = dispositivoNombre;
    }

    public Date getFechaHora() {
        return fechaHora;
    }

    public void setFechaHora(Date fechaHora) {
        this.fechaHora = fechaHora;
    }
}
