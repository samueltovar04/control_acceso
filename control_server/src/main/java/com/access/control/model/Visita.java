package com.access.control.model;
import com.access.control.model.generic.AbstractEntity;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.awt.*;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Objects;

import javax.persistence.*;
import javax.validation.constraints.Past;

@Entity
@Table(name = "visitantes")
public class Visita extends AbstractEntity implements Serializable {
 
    private static final long serialVersionUID = -3465813074586302847L;
    @Column(name="badge_access")
    private int badgeAccess;
    @Column
    private int document;
    @Column
    private String name;
    @Column(name="last_name")
    private String lastName;
    @Column(name="type_document")
    private String typeDocument;
    @Column
    private String sex;
    @Column
    private String elements;

    @Column
    private byte[] picture;
    @Lob
    @Basic(fetch = FetchType.LAZY)
    public byte[] getPicture() {
        return picture;
    }

    public void setPicture(byte[] picture) {
        this.picture = picture;
    }
    @JsonProperty("visitDate")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    @Past
    @Column(name="visit_date")
    private Date visitDate;

    public Date getVisitDate() {
        return visitDate;
    }

    public void setVisitDate(Date visitDate) {
        this.visitDate = visitDate;
    }

    @Column
    private String huella1;

    @Column
    private String huella2;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "visita")
    private List<PisoPermisoVisita> listPisos = new ArrayList<>();

    public List<PisoPermisoVisita> getListPisos() {
        return listPisos;
    }

    public void setListPisos(List<PisoPermisoVisita> listPisos) {
        this.listPisos = listPisos;
    }

    public Visita() {
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

    public int getBadgeAccess() {
        return badgeAccess;
    }

    public void setBadgeAccess(int badge_access) {
        this.badgeAccess = badge_access;
    }

    public int getDocument() {
        return document;
    }

    public void setDocument(int document) {
        this.document = document;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String last_name) {
        this.lastName = last_name;
    }

    public String getTypeDocument() {
        return typeDocument;
    }

    public void setTypeDocument(String type_document) {
        this.typeDocument = type_document;
    }

    public String getSex() {
        return sex;
    }

    public void setSex(String sex) {
        this.sex = sex;
    }

    public String getElements() {
        return elements;
    }

    public void setElements(String elements) {
        this.elements = elements;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Visita)) return false;
        Visita visita = (Visita) o;
        return getBadgeAccess() == visita.getBadgeAccess() &&
                getDocument() == visita.getDocument() &&
                Objects.equals(getName(), visita.getName()) &&
                Objects.equals(getLastName(), visita.getLastName()) &&
                Objects.equals(getTypeDocument(), visita.getTypeDocument()) &&
                Objects.equals(getSex(), visita.getSex()) &&
                Objects.equals(getElements(), visita.getElements()) &&
                Objects.equals(getPicture(), visita.getPicture()) &&
                Objects.equals(getHuella1(), visita.getHuella1()) &&
                Objects.equals(getHuella2(), visita.getHuella2());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getBadgeAccess(), getDocument(), getName(), getLastName(), getTypeDocument(), getSex(), getElements(), getPicture(), getHuella1(), getHuella2());
    }

    @Override
    public String toString() {
        return "Visita{" +
                "badgeAccess=" + badgeAccess +
                ", document=" + document +
                ", name='" + name + '\'' +
                ", lastName='" + lastName + '\'' +
                ", typeDocument='" + typeDocument + '\'' +
                ", sex='" + sex + '\'' +
                ", elements='" + elements + '\'' +
                ", picture=" + picture +
                ", huella1='" + huella1 + '\'' +
                ", huella2='" + huella2 + '\'' +
                '}';
    }

}