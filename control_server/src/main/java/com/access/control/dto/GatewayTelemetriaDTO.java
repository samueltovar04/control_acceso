package com.access.control.dto;

public class GatewayTelemetriaDTO {

    private String id_pulsera;
    private Long cliente_id;
    private Float bpm;
    private Float spo2;
    private Float temperatura;
    private Integer estado_alerta;

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
}
