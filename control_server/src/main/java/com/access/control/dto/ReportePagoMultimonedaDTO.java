package com.access.control.dto;

import java.math.BigDecimal;

public class ReportePagoMultimonedaDTO {
    private Long clienteId;
    private BigDecimal montoOriginal;
    private String monedaDeclarada = "USD";
    private BigDecimal tasaBcv;
    private BigDecimal montoEquivalenteVES;
    private String metodoPago;
    private String numeroReferencia;
    private String fechaPago;
    private String comprobanteBase64;
    private String comprobanteUrl;
    private String codigoCupon;

    public String getCodigoCupon() { return codigoCupon; }
    public void setCodigoCupon(String codigoCupon) { this.codigoCupon = codigoCupon; }

    public Long getClienteId() { return clienteId; }
    public void setClienteId(Long clienteId) { this.clienteId = clienteId; }

    public BigDecimal getMontoOriginal() { return montoOriginal; }
    public void setMontoOriginal(BigDecimal montoOriginal) { this.montoOriginal = montoOriginal; }

    public String getMonedaDeclarada() { return monedaDeclarada; }
    public void setMonedaDeclarada(String monedaDeclarada) { this.monedaDeclarada = monedaDeclarada; }

    public BigDecimal getTasaBcv() { return tasaBcv; }
    public void setTasaBcv(BigDecimal tasaBcv) { this.tasaBcv = tasaBcv; }

    public BigDecimal getMontoEquivalenteVES() { return montoEquivalenteVES; }
    public void setMontoEquivalenteVES(BigDecimal montoEquivalenteVES) { this.montoEquivalenteVES = montoEquivalenteVES; }

    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }

    public String getNumeroReferencia() { return numeroReferencia; }
    public void setNumeroReferencia(String numeroReferencia) { this.numeroReferencia = numeroReferencia; }

    public String getFechaPago() { return fechaPago; }
    public void setFechaPago(String fechaPago) { this.fechaPago = fechaPago; }

    public String getComprobanteBase64() { return comprobanteBase64; }
    public void setComprobanteBase64(String comprobanteBase64) { this.comprobanteBase64 = comprobanteBase64; }

    public String getComprobanteUrl() { return comprobanteUrl; }
    public void setComprobanteUrl(String comprobanteUrl) { this.comprobanteUrl = comprobanteUrl; }
}
