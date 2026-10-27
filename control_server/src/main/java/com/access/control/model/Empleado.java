package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;
import jakarta.persistence.*;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "empleados")
public class Empleado extends AbstractEntity {

    @Column(name = "badge_access")
    private Integer badgeAccess;

    @Column(name = "birth_date")
    @Temporal(TemporalType.TIMESTAMP)
    private Date birthDate;

    @Column(name = "document")
    private Integer document;

    @Column(name = "email")
    private String email;

    @Column(name = "enabled")
    private Boolean enabled = true;

    @Column(name = "huella1", length = 1024)
    private String huella1;

    @Column(name = "huella2", length = 1024)
    private String huella2;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "name")
    private String name;

    @Column(name = "picture", columnDefinition = "bytea")
    private byte[] picture;

    @Column(name = "sex")
    private String sex;

    @Column(name = "telephone")
    private String telephone;

    @ManyToOne
    @JoinColumn(name = "gerencia_id")
    private Gerencia gerencia;

    @ManyToOne
    @JoinColumn(name = "sede_id")
    private Sede sede;

    @ManyToOne
    @JoinColumn(name = "tipo_contrato_id")
    private TipoContrato tipoContrato;

    @Column(name = "legajo", length = 20)
    private String legajo;

    @Column(name = "face_vector", columnDefinition = "TEXT")
    private String faceVector;

    @OneToOne
    private User user;

    @ManyToMany(fetch = FetchType.LAZY)
    private List<Piso> pisosPermitidos;

    public Integer getBadgeAccess() {
        return badgeAccess;
    }

    public void setBadgeAccess(Integer badgeAccess) {
        this.badgeAccess = badgeAccess;
    }

    public String getCodigoInsignia() {
        return badgeAccess != null ? String.valueOf(badgeAccess) : null;
    }

    public void setCodigoInsignia(String codigoInsignia) {
        if (codigoInsignia != null && !codigoInsignia.trim().isEmpty()) {
            try {
                this.badgeAccess = Integer.parseInt(codigoInsignia.replaceAll("\\D", ""));
            } catch (Exception e) {
                this.badgeAccess = null;
            }
        }
    }

    public Date getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(Date birthDate) {
        this.birthDate = birthDate;
    }

    public Date getFechaNacimiento() {
        return birthDate;
    }

    public void setFechaNacimiento(Date fechaNacimiento) {
        this.birthDate = fechaNacimiento;
    }

    public Integer getDocument() {
        return document;
    }

    public void setDocument(Integer document) {
        this.document = document;
    }

    public String getDocumento() {
        return document != null ? String.valueOf(document) : null;
    }

    public void setDocumento(String documento) {
        if (documento != null && !documento.trim().isEmpty()) {
            try {
                this.document = Integer.parseInt(documento.replaceAll("\\D", ""));
            } catch (Exception e) {
                this.document = null;
            }
        }
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
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

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getApellido() {
        return lastName;
    }

    public void setApellido(String apellido) {
        this.lastName = apellido;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getNombre() {
        return name;
    }

    public void setNombre(String nombre) {
        this.name = nombre;
    }

    public byte[] getPicture() {
        return picture;
    }

    public void setPicture(byte[] picture) {
        this.picture = picture;
    }

    public String getFoto() {
        return picture != null ? new String(picture) : null;
    }

    public void setFoto(String foto) {
        if (foto != null) {
            this.picture = foto.getBytes();
        }
    }

    public String getSex() {
        return sex;
    }

    public void setSex(String sex) {
        this.sex = sex;
    }

    public String getSexo() {
        return sex;
    }

    public void setSexo(String sexo) {
        this.sex = sexo;
    }

    public String getTelephone() {
        return telephone;
    }

    public void setTelephone(String telephone) {
        this.telephone = telephone;
    }

    public String getTelefono() {
        return telephone;
    }

    public void setTelefono(String telefono) {
        this.telephone = telefono;
    }

    public Gerencia getGerencia() {
        return gerencia;
    }

    public void setGerencia(Gerencia gerencia) {
        this.gerencia = gerencia;
    }

    public Sede getSede() {
        return sede;
    }

    public void setSede(Sede sede) {
        this.sede = sede;
    }

    public TipoContrato getTipoContrato() {
        return tipoContrato;
    }

    public void setTipoContrato(TipoContrato tipoContrato) {
        this.tipoContrato = tipoContrato;
    }

    public String getLegajo() {
        return legajo;
    }

    public void setLegajo(String legajo) {
        this.legajo = legajo;
    }

    public String getFaceVector() {
        return faceVector;
    }

    public void setFaceVector(String faceVector) {
        this.faceVector = faceVector;
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
