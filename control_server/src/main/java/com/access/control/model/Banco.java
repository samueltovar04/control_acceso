package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "bancos")
public class Banco extends AbstractEntity {

    @Column(nullable = false)
    private String nombre;

    private String codigo;

    @Column(nullable = false)
    private String tipo;

    private String numeroCuenta;

    private String titular;

    private String documentoTitular;

    private String telefono;

    private String email;

    private String red;

    private String direccionBilletera;

    private String memoQr;

    private String moneda;

    @Column(columnDefinition = "TEXT")
    private String notasInstruccion;

    private Boolean activo = true;

    public Banco() {
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getNumeroCuenta() {
        return numeroCuenta;
    }

    public void setNumeroCuenta(String numeroCuenta) {
        this.numeroCuenta = numeroCuenta;
    }

    public String getTitular() {
        return titular;
    }

    public void setTitular(String titular) {
        this.titular = titular;
    }

    public String getDocumentoTitular() {
        return documentoTitular;
    }

    public void setDocumentoTitular(String documentoTitular) {
        this.documentoTitular = documentoTitular;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRed() {
        return red;
    }

    public void setRed(String red) {
        this.red = red;
    }

    public String getDireccionBilletera() {
        return direccionBilletera;
    }

    public void setDireccionBilletera(String direccionBilletera) {
        this.direccionBilletera = direccionBilletera;
    }

    public String getMemoQr() {
        return memoQr;
    }

    public void setMemoQr(String memoQr) {
        this.memoQr = memoQr;
    }

    public String getMoneda() {
        return moneda;
    }

    public void setMoneda(String moneda) {
        this.moneda = moneda;
    }

    public String getNotasInstruccion() {
        return notasInstruccion;
    }

    public void setNotasInstruccion(String notasInstruccion) {
        this.notasInstruccion = notasInstruccion;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }
}
