package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;

import javax.persistence.*;
import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name="dispositivos")
public class Dispositivo  extends AbstractEntity implements Serializable {

    private static final long serialVersionUID = 1L;
    private String ip;
    private Integer port;
    private String descripcion;
    private Boolean ping;
    @Column(name="entrada_salida")
    private Integer  entradaSalida;

    @OneToOne
    @JoinColumn(name = "piso_id", referencedColumnName = "id")
    private Piso piso;

    public Dispositivo() {
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

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Boolean getPing() {
        return ping;
    }

    public void setPing(Boolean ping) {
        this.ping = ping;
    }

    public Integer getEntradaSalida() {
        return entradaSalida;
    }

    public void setEntradaSalida(Integer entradaSalida) {
        this.entradaSalida = entradaSalida;
    }

    public Piso getPiso() {
        return piso;
    }

    public void setPiso(Piso piso) {
        this.piso = piso;
    }

    public String getColor(){
        if(getState()==1 && getPing()) {
            return "green";
        }else if(getState()==0){
            return "yellow";
        }else{
            return "red";
        }
    }


    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Dispositivo)) return false;
        Dispositivo that = (Dispositivo) o;
        return Objects.equals(getIp(), that.getIp()) &&
                Objects.equals(getPort(), that.getPort()) &&
                Objects.equals(getDescripcion(), that.getDescripcion()) &&
                Objects.equals(getPing(), that.getPing()) &&
                Objects.equals(getEntradaSalida(), that.getEntradaSalida()) &&
                Objects.equals(getPiso(), that.getPiso());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getIp(), getPort(), getDescripcion(), getPing(), getEntradaSalida(), getPiso());
    }

    @Override
    public String toString() {
        return "Dispositivo{" +
                "ip='" + ip + '\'' +
                ", port=" + port +
                ", descripcion='" + descripcion + '\'' +
                ", ping=" + ping +
                ", entradaSalida=" + entradaSalida +
                ", piso=" + piso +
                '}';
    }
}
