package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.Date;

@Entity
@Table(name = "conciliaciones_pago")
public class ConciliacionPago extends AbstractEntity {

    @OneToOne
    private Pago pago;

    @Temporal(TemporalType.TIMESTAMP)
    private Date fechaConciliacion;

    private BigDecimal montoExtractoBancario;

    private BigDecimal montoRegistrado;

    private String estado = "PENDIENTE"; // CONCILIADO, DISCREPANCIA, PENDIENTE

    private String observaciones;

    private String conciliadoPorUser;

    public Pago getPago() {
        return pago;
    }

    public void setPago(Pago pago) {
        this.pago = pago;
    }

    public Date getFechaConciliacion() {
        return fechaConciliacion;
    }

    public void setFechaConciliacion(Date fechaConciliacion) {
        this.fechaConciliacion = fechaConciliacion;
    }

    public BigDecimal getMontoExtractoBancario() {
        return montoExtractoBancario;
    }

    public void setMontoExtractoBancario(BigDecimal montoExtractoBancario) {
        this.montoExtractoBancario = montoExtractoBancario;
    }

    public BigDecimal getMontoRegistrado() {
        return montoRegistrado;
    }

    public void setMontoRegistrado(BigDecimal montoRegistrado) {
        this.montoRegistrado = montoRegistrado;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public String getConciliadoPorUser() {
        return conciliadoPorUser;
    }

    public void setConciliadoPorUser(String conciliadoPorUser) {
        this.conciliadoPorUser = conciliadoPorUser;
    }
}
