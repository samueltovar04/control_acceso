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

    @Column(columnDefinition = "TEXT")
    private String registradoPor;

    private String numeroReferencia;

    @Column(columnDefinition = "TEXT")
    private String comprobanteUrl;

    private String estadoPago; // COMPLETADO, PENDIENTE_CONCILIACION, RECHAZADO, PENDIENTE_CONCILIAR, CONCILIADO

    private String monedaDeclarada = "USD";

    @Column(precision = 14, scale = 4)
    private BigDecimal tasaBcvAplicada = new BigDecimal("1.0000");

    @Column(precision = 14, scale = 2)
    private BigDecimal montoEquivalenteVes = BigDecimal.ZERO;

    private String comprobanteSha256;

    private Long usuarioConciliaId;

    @Temporal(TemporalType.TIMESTAMP)
    private Date fechaConciliacion;

    private String motivoRechazo;

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

    public String getMonedaDeclarada() {
        return monedaDeclarada;
    }

    public void setMonedaDeclarada(String monedaDeclarada) {
        this.monedaDeclarada = monedaDeclarada;
    }

    public BigDecimal getTasaBcvAplicada() {
        return tasaBcvAplicada;
    }

    public void setTasaBcvAplicada(BigDecimal tasaBcvAplicada) {
        this.tasaBcvAplicada = tasaBcvAplicada;
    }

    public BigDecimal getMontoEquivalenteVes() {
        return montoEquivalenteVes;
    }

    public void setMontoEquivalenteVes(BigDecimal montoEquivalenteVes) {
        this.montoEquivalenteVes = montoEquivalenteVes;
    }

    public String getComprobanteSha256() {
        return comprobanteSha256;
    }

    public void setComprobanteSha256(String comprobanteSha256) {
        this.comprobanteSha256 = comprobanteSha256;
    }

    public Long getUsuarioConciliaId() {
        return usuarioConciliaId;
    }

    public void setUsuarioConciliaId(Long usuarioConciliaId) {
        this.usuarioConciliaId = usuarioConciliaId;
    }

    public Date getFechaConciliacion() {
        return fechaConciliacion;
    }

    public void setFechaConciliacion(Date fechaConciliacion) {
        this.fechaConciliacion = fechaConciliacion;
    }

    public String getMotivoRechazo() {
        return motivoRechazo;
    }

    public void setMotivoRechazo(String motivoRechazo) {
        this.motivoRechazo = motivoRechazo;
    }
}
