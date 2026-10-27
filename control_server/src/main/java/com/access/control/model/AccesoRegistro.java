package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;
import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "acceso_registros")
public class AccesoRegistro extends AbstractEntity {

    @ManyToOne
    private Cliente cliente;

    @ManyToOne
    private Empleado empleado;

    @ManyToOne
    private Visita visita;

    @ManyToOne
    private Dispositivo dispositivo;

    private String metodoVerificacion; // RFID_BADGE, HUELLA, ROSTRO, QR_MOBILE

    private Boolean concedido = true;

    private String motivoDenegacion;

    @Temporal(TemporalType.TIMESTAMP)
    private Date fechaHora;

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

    public Visita getVisita() {
        return visita;
    }

    public void setVisita(Visita visita) {
        this.visita = visita;
    }

    public Dispositivo getDispositivo() {
        return dispositivo;
    }

    public void setDispositivo(Dispositivo dispositivo) {
        this.dispositivo = dispositivo;
    }

    public String getMetodoVerificacion() {
        return metodoVerificacion;
    }

    public void setMetodoVerificacion(String metodoVerificacion) {
        this.metodoVerificacion = metodoVerificacion;
    }

    public Boolean getConcedido() {
        return concedido;
    }

    public void setConcedido(Boolean concedido) {
        this.concedido = concedido;
    }

    public String getMotivoDenegacion() {
        return motivoDenegacion;
    }

    public void setMotivoDenegacion(String motivoDenegacion) {
        this.motivoDenegacion = motivoDenegacion;
    }

    public Date getFechaHora() {
        return fechaHora;
    }

    public void setFechaHora(Date fechaHora) {
        this.fechaHora = fechaHora;
    }
}
