package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;
import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "notificaciones_pago")
public class NotificacionPago extends AbstractEntity {

    @ManyToOne
    private Cliente cliente;

    private String titulo;

    private String mensaje;

    private String tipo; // RECORDATORIO_VENCIMIENTO, CONFIRMACION_PAGO, AVISO_MORA, RECHAZO_PAGO

    @Temporal(TemporalType.TIMESTAMP)
    private Date fechaEnvio;

    private Boolean leido = false;

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
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

    public Date getFechaEnvio() {
        return fechaEnvio;
    }

    public void setFechaEnvio(Date fechaEnvio) {
        this.fechaEnvio = fechaEnvio;
    }

    public Boolean getLeido() {
        return leido;
    }

    public void setLeido(Boolean leido) {
        this.leido = leido;
    }
}
