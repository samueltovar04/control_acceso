package com.access.control.dto;

import java.util.List;
import java.util.Map;

public class DispositivoEscaneoDTO {
    private Long id;
    private String descripcion;
    private String ip;
    private Integer port;
    private Boolean online;
    private Long latenciaMs;
    private String mac;
    private String fabricante;
    private String hostname;
    private String tipoDispositivo;
    private String sistemaOperativo;
    private String firmware;
    private List<Integer> puertosAbiertos;
    private Map<String, String> serviciosDetectados;
    private String fechaEscaneo;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }

    public Integer getPort() {
        return port;
    }

    public void setPort(Integer port) {
        this.port = port;
    }

    public Boolean getOnline() {
        return online;
    }

    public void setOnline(Boolean online) {
        this.online = online;
    }

    public Long getLatenciaMs() {
        return latenciaMs;
    }

    public void setLatenciaMs(Long latenciaMs) {
        this.latenciaMs = latenciaMs;
    }

    public String getMac() {
        return mac;
    }

    public void setMac(String mac) {
        this.mac = mac;
    }

    public String getFabricante() {
        return fabricante;
    }

    public void setFabricante(String fabricante) {
        this.fabricante = fabricante;
    }

    public String getHostname() {
        return hostname;
    }

    public void setHostname(String hostname) {
        this.hostname = hostname;
    }

    public String getTipoDispositivo() {
        return tipoDispositivo;
    }

    public void setTipoDispositivo(String tipoDispositivo) {
        this.tipoDispositivo = tipoDispositivo;
    }

    public String getSistemaOperativo() {
        return sistemaOperativo;
    }

    public void setSistemaOperativo(String sistemaOperativo) {
        this.sistemaOperativo = sistemaOperativo;
    }

    public String getFirmware() {
        return firmware;
    }

    public void setFirmware(String firmware) {
        this.firmware = firmware;
    }

    public List<Integer> getPuertosAbiertos() {
        return puertosAbiertos;
    }

    public void setPuertosAbiertos(List<Integer> puertosAbiertos) {
        this.puertosAbiertos = puertosAbiertos;
    }

    public Map<String, String> getServiciosDetectados() {
        return serviciosDetectados;
    }

    public void setServiciosDetectados(Map<String, String> serviciosDetectados) {
        this.serviciosDetectados = serviciosDetectados;
    }

    public String getFechaEscaneo() {
        return fechaEscaneo;
    }

    public void setFechaEscaneo(String fechaEscaneo) {
        this.fechaEscaneo = fechaEscaneo;
    }
}
