package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;
import jakarta.persistence.*;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "visitantes")
public class Visita extends AbstractEntity {

    @Column(name = "badge_access")
    private Integer badgeAccess;

    @Column(name = "document")
    private Integer document;

    @Column(name = "elements")
    private String elements;

    @Column(name = "huella1")
    private String huella1;

    @Column(name = "huella2")
    private String huella2;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "name")
    private String name;

    @Column(name = "picture", columnDefinition = "bytea")
    private byte[] picture;

    @Column(name = "sex")
    private String sex;

    @Column(name = "type_document")
    private String typeDocument;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "visit_date")
    private Date visitDate;

    @Transient
    private String email;

    @Transient
    private String telefono;

    @ManyToOne
    private Empleado empleadoAVisitar;

    @ManyToMany(fetch = FetchType.LAZY)
    private List<Piso> pisosPermitidos;

    public Integer getBadgeAccess() {
        return badgeAccess;
    }

    public void setBadgeAccess(Integer badgeAccess) {
        this.badgeAccess = badgeAccess;
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

    public String getElements() {
        return elements;
    }

    public void setElements(String elements) {
        this.elements = elements;
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

    public String getTypeDocument() {
        return typeDocument;
    }

    public void setTypeDocument(String typeDocument) {
        this.typeDocument = typeDocument;
    }

    public Date getVisitDate() {
        return visitDate;
    }

    public void setVisitDate(Date visitDate) {
        this.visitDate = visitDate;
    }

    public Date getFechaIngreso() {
        return visitDate;
    }

    public void setFechaIngreso(Date fechaIngreso) {
        this.visitDate = fechaIngreso;
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

    public Empleado getEmpleadoAVisitar() {
        return empleadoAVisitar;
    }

    public void setEmpleadoAVisitar(Empleado empleadoAVisitar) {
        this.empleadoAVisitar = empleadoAVisitar;
    }

    public List<Piso> getPisosPermitidos() {
        return pisosPermitidos;
    }

    public void setPisosPermitidos(List<Piso> pisosPermitidos) {
        this.pisosPermitidos = pisosPermitidos;
    }
}
