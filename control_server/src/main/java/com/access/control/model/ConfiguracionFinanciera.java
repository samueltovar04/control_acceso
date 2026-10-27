package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "configuracion_financiera")
public class ConfiguracionFinanciera extends AbstractEntity {

    @Column(nullable = false, length = 3)
    private String monedaBase = "USD";

    @Column(nullable = false, length = 3)
    private String monedaEquivalenciaDefecto = "VES";

    @Column(nullable = false, length = 20)
    private String reglaRedondeo = "HALF_UP";

    @Column(nullable = false)
    private Integer decimalesFijacion = 2;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal margenToleranciaPagoVes = new BigDecimal("0.50");

    @Column(nullable = false)
    private Integer diasGraciaConciliacion = 2;

    @Column(nullable = false)
    private LocalDateTime actualizadoEl = LocalDateTime.now();

    public String getMonedaBase() {
        return monedaBase;
    }

    public void setMonedaBase(String monedaBase) {
        this.monedaBase = monedaBase;
    }

    public String getMonedaEquivalenciaDefecto() {
        return monedaEquivalenciaDefecto;
    }

    public void setMonedaEquivalenciaDefecto(String monedaEquivalenciaDefecto) {
        this.monedaEquivalenciaDefecto = monedaEquivalenciaDefecto;
    }

    public String getReglaRedondeo() {
        return reglaRedondeo;
    }

    public void setReglaRedondeo(String reglaRedondeo) {
        this.reglaRedondeo = reglaRedondeo;
    }

    public Integer getDecimalesFijacion() {
        return decimalesFijacion;
    }

    public void setDecimalesFijacion(Integer decimalesFijacion) {
        this.decimalesFijacion = decimalesFijacion;
    }

    public BigDecimal getMargenToleranciaPagoVes() {
        return margenToleranciaPagoVes;
    }

    public void setMargenToleranciaPagoVes(BigDecimal margenToleranciaPagoVes) {
        this.margenToleranciaPagoVes = margenToleranciaPagoVes;
    }

    public Integer getDiasGraciaConciliacion() {
        return diasGraciaConciliacion;
    }

    public void setDiasGraciaConciliacion(Integer diasGraciaConciliacion) {
        this.diasGraciaConciliacion = diasGraciaConciliacion;
    }

    public LocalDateTime getActualizadoEl() {
        return actualizadoEl;
    }

    public void setActualizadoEl(LocalDateTime actualizadoEl) {
        this.actualizadoEl = actualizadoEl;
    }
}
