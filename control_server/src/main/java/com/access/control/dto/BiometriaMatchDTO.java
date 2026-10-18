package com.access.control.dto;

public class BiometriaMatchDTO {
    private Long id;
    private String nombre;
    private String apellido;
    private String tipo;
    private Double distancia;
    private Double confianza;

    public BiometriaMatchDTO() {
    }

    public BiometriaMatchDTO(Long id, String nombre, String apellido, String tipo, Double distancia, Double confianza) {
        this.id = id;
        this.nombre = nombre;
        this.apellido = apellido;
        this.tipo = tipo;
        this.distancia = distancia;
        this.confianza = confianza;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getApellido() {
        return apellido;
    }

    public void setApellido(String apellido) {
        this.apellido = apellido;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public Double getDistancia() {
        return distancia;
    }

    public void setDistancia(Double distancia) {
        this.distancia = distancia;
    }

    public Double getConfianza() {
        return confianza;
    }

    public void setConfianza(Double confianza) {
        this.confianza = confianza;
    }
}
