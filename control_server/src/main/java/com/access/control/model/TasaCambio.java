package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tasa_cambio", uniqueConstraints = {
    @UniqueConstraint(name = "uq_tasa_diaria", columnNames = {"monedaOrigen", "monedaDestino", "fechaVigencia"})
})
public class TasaCambio extends AbstractEntity {

    @Column(nullable = false, length = 3)
    private String monedaOrigen = "USD";

    @Column(nullable = false, length = 3)
    private String monedaDestino = "VES";

    @Column(nullable = false, precision = 14, scale = 4)
    private BigDecimal valor;

    @Column(nullable = false)
    private LocalDate fechaVigencia;

    @Column(nullable = false)
    private LocalDateTime fechaCaptura = LocalDateTime.now();

    @Column(nullable = false, length = 50)
    private String origenCaptura = "BCV_SCRAPER_AUTO";

    private Long usuarioId;

    public String getMonedaOrigen() {
        return monedaOrigen;
    }

    public void setMonedaOrigen(String monedaOrigen) {
        this.monedaOrigen = monedaOrigen;
    }

    public String getMonedaDestino() {
        return monedaDestino;
    }

    public void setMonedaDestino(String monedaDestino) {
        this.monedaDestino = monedaDestino;
    }

    public BigDecimal getValor() {
        return valor;
    }

    public void setValor(BigDecimal valor) {
        this.valor = valor;
    }

    public LocalDate getFechaVigencia() {
        return fechaVigencia;
    }

    public void setFechaVigencia(LocalDate fechaVigencia) {
        this.fechaVigencia = fechaVigencia;
    }

    public LocalDateTime getFechaCaptura() {
        return fechaCaptura;
    }

    public void setFechaCaptura(LocalDateTime fechaCaptura) {
        this.fechaCaptura = fechaCaptura;
    }

    public String getOrigenCaptura() {
        return origenCaptura;
    }

    public void setOrigenCaptura(String origenCaptura) {
        this.origenCaptura = origenCaptura;
    }

    public Long getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(Long usuarioId) {
        this.usuarioId = usuarioId;
    }
}
