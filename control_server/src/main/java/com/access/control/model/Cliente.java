package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;
import jakarta.persistence.*;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "clientes")
public class Cliente extends AbstractEntity {

    private String documento;
    private String codigoInsignia;
    private String nombre;
    private String apellido;
    private String email;
    private String telefono;
    private String foto;
    private String sexo;

    @Temporal(TemporalType.DATE)
    private Date fechaNacimiento;

    @Column(columnDefinition = "TEXT")
    private String huella1;

    @Column(columnDefinition = "TEXT")
    private String huella2;

    @Column(columnDefinition = "TEXT")
    private String faceVector;

    private String estadoSuscripcion = "SIN_MEMBRESIA"; // ACTIVA, VENCIDA, POR_VENCER, SUSPENDIDA

    @ManyToOne
    private Sede sede;

    @OneToOne
    private User user;

    @ManyToMany(fetch = FetchType.LAZY)
    private List<Piso> pisosPermitidos;

    public String getDocumento() {
        return documento;
    }

    public void setDocumento(String documento) {
        this.documento = documento;
    }

    public String getCodigoInsignia() {
        return codigoInsignia;
    }

    public void setCodigoInsignia(String codigoInsignia) {
        this.codigoInsignia = codigoInsignia;
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getFoto() {
        return foto;
    }

    public void setFoto(String foto) {
        this.foto = foto;
    }

    public String getSexo() {
        return sexo;
    }

    public void setSexo(String sexo) {
        this.sexo = sexo;
    }

    public Date getFechaNacimiento() {
        return fechaNacimiento;
    }

    public void setFechaNacimiento(Date fechaNacimiento) {
        this.fechaNacimiento = fechaNacimiento;
    }

    public String getHuella1() {
        return huella1;
    }

    public void setHuella1(String huella1) {
        this.huella1 = huella1;
    }

    public String getHuella2() {
        return huella2;
    }

    public void setHuella2(String huella2) {
        this.huella2 = huella2;
    }

    public String getFaceVector() {
        return faceVector;
    }

    public void setFaceVector(String faceVector) {
        this.faceVector = faceVector;
    }

    public String getEstadoSuscripcion() {
        return estadoSuscripcion;
    }

    public void setEstadoSuscripcion(String estadoSuscripcion) {
        this.estadoSuscripcion = estadoSuscripcion;
    }

    public Sede getSede() {
        return sede;
    }

    public void setSede(Sede sede) {
        this.sede = sede;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public List<Piso> getPisosPermitidos() {
        return pisosPermitidos;
    }

    public void setPisosPermitidos(List<Piso> pisosPermitidos) {
        this.pisosPermitidos = pisosPermitidos;
    }
}
