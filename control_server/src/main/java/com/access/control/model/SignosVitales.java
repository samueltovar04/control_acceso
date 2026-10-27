package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;
import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "signos_vitales")
public class SignosVitales extends AbstractEntity {

    @ManyToOne
    private Cliente cliente;

    @ManyToOne
    private Empleado empleado;

    private Integer ritmocardiacoBpm;

    private Integer saturacionOxigenoSpo2;

    private Double temperaturaCorporal;

    private Integer nivelEstres; // 0 a 100

    private String presionArterial; // Ej. "120/80"

    private Boolean alertaSalud = false;

    private String mensajeAlerta;

    @Temporal(TemporalType.TIMESTAMP)
    private Date timestamp;

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public Empleado getEmpleado() {
        return empleado;
    }

    public void setEmpleado(Empleado empleado) {
        this.empleado = empleado;
    }

    public Integer getRitmocardiacoBpm() {
        return ritmocardiacoBpm;
    }

    public void setRitmocardiacoBpm(Integer ritmocardiacoBpm) {
        this.ritmocardiacoBpm = ritmocardiacoBpm;
    }

    public Integer getSaturacionOxigenoSpo2() {
        return saturacionOxigenoSpo2;
    }

    public void setSaturacionOxigenoSpo2(Integer saturacionOxigenoSpo2) {
        this.saturacionOxigenoSpo2 = saturacionOxigenoSpo2;
    }

    public Double getTemperaturaCorporal() {
        return temperaturaCorporal;
    }

    public void setTemperaturaCorporal(Double temperaturaCorporal) {
        this.temperaturaCorporal = temperaturaCorporal;
    }

    public Integer getNivelEstres() {
        return nivelEstres;
    }

    public void setNivelEstres(Integer nivelEstres) {
        this.nivelEstres = nivelEstres;
    }

    public String getPresionArterial() {
        return presionArterial;
    }

    public void setPresionArterial(String presionArterial) {
        this.presionArterial = presionArterial;
    }

    public Boolean getAlertaSalud() {
        return alertaSalud;
    }

    public void setAlertaSalud(Boolean alertaSalud) {
        this.alertaSalud = alertaSalud;
    }

    public String getMensajeAlerta() {
        return mensajeAlerta;
    }

    public void setMensajeAlerta(String mensajeAlerta) {
        this.mensajeAlerta = mensajeAlerta;
    }

    public Date getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Date timestamp) {
        this.timestamp = timestamp;
    }
}
