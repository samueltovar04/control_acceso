package com.access.control.dto;

import java.util.List;

public class DispositivoDescubiertoDTO {
    private String ip;
    private String mac;
    private String fabricante;
    private String hostname;
    private Integer port;
    private List<Integer> puertosAbiertos;
    private String tipoDispositivo;
    private String sistemaOperativo;
    private String descripcion;
    private Long pisoId;
    private Integer entradaSalida;
    private Boolean online;
    private Long latenciaMs;
    private boolean seleccionado;

    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
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

    public Integer getPort() {
        return port;
    }

    public void setPort(Integer port) {
        this.port = port;
    }

    public List<Integer> getPuertosAbiertos() {
        return puertosAbiertos;
    }

    public void setPuertosAbiertos(List<Integer> puertosAbiertos) {
        this.puertosAbiertos = puertosAbiertos;
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

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Long getPisoId() {
        return pisoId;
    }

    public void setPisoId(Long pisoId) {
        this.pisoId = pisoId;
    }

    public Integer getEntradaSalida() {
        return entradaSalida;
    }

    public void setEntradaSalida(Integer entradaSalida) {
        this.entradaSalida = entradaSalida;
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

    public boolean isSeleccionado() {
        return seleccionado;
    }

    public void setSeleccionado(boolean seleccionado) {
        this.seleccionado = seleccionado;
    }
}
