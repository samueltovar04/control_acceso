package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.Date;

@Entity
@Table(name = "pagos")
public class Pago extends AbstractEntity {

    @ManyToOne
    private Cliente cliente;

    @ManyToOne
    private SuscripcionCliente suscripcion;

    @ManyToOne
    private Sede sede;

    private BigDecimal monto;

    @Temporal(TemporalType.TIMESTAMP)
    private Date fechaPago;

    private String metodoPago; // EFECTIVO, TARJETA, TRANSFERENCIA, APP_ONLINE

    private String origenPago; // WEB_ADMIN, WEB_CLIENTE, APP_MOBILE

    private String registradoPor; // Nombre/usuario del cajero o cliente

    private String numeroReferencia;

    private String comprobanteUrl;

    private String estadoPago; // COMPLETADO, PENDIENTE_CONCILIACION, RECHAZADO

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public SuscripcionCliente getSuscripcion() {
        return suscripcion;
    }

    public void setSuscripcion(SuscripcionCliente suscripcion) {
        this.suscripcion = suscripcion;
    }

    public Sede getSede() {
        return sede;
    }

    public void setSede(Sede sede) {
        this.sede = sede;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }

    public Date getFechaPago() {
        return fechaPago;
    }

    public void setFechaPago(Date fechaPago) {
        this.fechaPago = fechaPago;
    }

    public String getMetodoPago() {
        return metodoPago;
    }

    public void setMetodoPago(String metodoPago) {
        this.metodoPago = metodoPago;
    }

    public String getOrigenPago() {
        return origenPago;
    }

    public void setOrigenPago(String origenPago) {
        this.origenPago = origenPago;
    }

    public String getRegistradoPor() {
        return registradoPor;
    }

    public void setRegistradoPor(String registradoPor) {
        this.registradoPor = registradoPor;
    }

    public String getNumeroReferencia() {
        return numeroReferencia;
    }

    public void setNumeroReferencia(String numeroReferencia) {
        this.numeroReferencia = numeroReferencia;
    }

    public String getComprobanteUrl() {
        return comprobanteUrl;
    }

    public void setComprobanteUrl(String comprobanteUrl) {
        this.comprobanteUrl = comprobanteUrl;
    }

    public String getEstadoPago() {
        return estadoPago;
    }

    public void setEstadoPago(String estadoPago) {
        this.estadoPago = estadoPago;
    }
}
