package com.access.control.dto;

public class GatewayTelemetriaDTO {

    private String id_pulsera;
    private Long cliente_id;
    private Float bpm;
    private Float spo2;
    private Float temperatura;
    private Integer estado_alerta;
    private String gateway_id;
    private String gateway_ip;
    private Long piso_id;
    private String piso_numero;
    private Long sede_id;
    private String sede_nombre;

    public GatewayTelemetriaDTO() {
    }

    public String getId_pulsera() {
        return id_pulsera;
    }

    public void setId_pulsera(String id_pulsera) {
        this.id_pulsera = id_pulsera;
    }

    public Long getCliente_id() {
        return cliente_id;
    }

    public void setCliente_id(Long cliente_id) {
        this.cliente_id = cliente_id;
    }

    public Float getBpm() {
        return bpm;
    }

    public void setBpm(Float bpm) {
        this.bpm = bpm;
    }

    public Float getSpo2() {
        return spo2;
    }

    public void setSpo2(Float spo2) {
        this.spo2 = spo2;
    }

    public Float getTemperatura() {
        return temperatura;
    }

    public void setTemperatura(Float temperatura) {
        this.temperatura = temperatura;
    }

    public Integer getEstado_alerta() {
        return estado_alerta;
    }

    public void setEstado_alerta(Integer estado_alerta) {
        this.estado_alerta = estado_alerta;
    }

    public String getGateway_id() {
        return gateway_id;
    }

    public void setGateway_id(String gateway_id) {
        this.gateway_id = gateway_id;
    }

    public String getGateway_ip() {
        return gateway_ip;
    }

    public void setGateway_ip(String gateway_ip) {
        this.gateway_ip = gateway_ip;
    }

    public Long getPiso_id() {
        return piso_id;
    }

    public void setPiso_id(Long piso_id) {
        this.piso_id = piso_id;
    }

    public String getPiso_numero() {
        return piso_numero;
    }

    public void setPiso_numero(String piso_numero) {
        this.piso_numero = piso_numero;
    }

    public Long getSede_id() {
        return sede_id;
    }

    public void setSede_id(Long sede_id) {
        this.sede_id = sede_id;
    }

    public String getSede_nombre() {
        return sede_nombre;
    }

    public void setSede_nombre(String sede_nombre) {
        this.sede_nombre = sede_nombre;
    }
}
