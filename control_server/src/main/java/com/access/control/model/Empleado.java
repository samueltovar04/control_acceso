package com.access.control.model;
import com.access.control.model.generic.AbstractEntity;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.sun.org.apache.xpath.internal.operations.Bool;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Objects;

import javax.persistence.*;
import javax.validation.constraints.Past;

@Entity
@Table(name = "empleados")
public class Empleado extends AbstractEntity implements Serializable {
 
    private static final long serialVersionUID = -3465813074586302847L;
 
    @Column
    private Integer document;

    @Column(name="badge_access")
    private Integer badgeAccess;

    @Column
    private String name;

    @Column(name="last_name")
    private String lastName;
 
    @Column
    private String email;

    @Column
    private Boolean enabled;
 
    @Column
    private String telephone;

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
    @Column
    private String sex;

    @JsonProperty("birthDate")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    @Past
    @Column(name="birth_date")
    private Date birthDate;

    @Column
    private String huella1;

    @Column
    private String huella2;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "empleado")
    private List<PisoPermiso> listPisos = new ArrayList<>();

    public Empleado() {
    }

    public Integer getBadgeAccess() {
        return badgeAccess;
    }

    public void setBadgeAccess(Integer badgeAccess) {
        this.badgeAccess = badgeAccess;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public Date getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(Date birthDate) {
        this.birthDate = birthDate;
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

    public Integer getDocument() {
		return document;
	}

	public void setDocument(Integer document) {
		this.document = document;
	}

	public String getSex() {
		return sex;
	}

	public void setSex(String sex) {
		this.sex = sex;
	}
 
    public String getName() {
        return name;
    }
 
    public void setName(String name) {
        this.name = name;
    }
 
    public String getEmail() {
        return email;
    }
 
    public void setEmail(String email) {
        this.email = email;
    }
 
    public String getTelephone() {
        return telephone;
    }
 
    public void setTelephone(String telephone) {
        this.telephone = telephone;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Empleado)) return false;
        Empleado empleado = (Empleado) o;
        return getDocument().equals(empleado.getDocument()) &&
                getBadgeAccess().equals(empleado.getBadgeAccess()) &&
                getName().equals(empleado.getName()) &&
                getEmail().equals(empleado.getEmail()) &&
                getEnabled().equals(empleado.getEnabled()) &&
                getTelephone().equals(empleado.getTelephone()) &&
                getPicture().equals(empleado.getPicture()) &&
                getSex().equals(empleado.getSex()) &&
                Objects.equals(getHuella1(), empleado.getHuella1()) &&
                Objects.equals(getHuella2(), empleado.getHuella2());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getDocument(), getBadgeAccess(), getName(), getEmail(), getEnabled(), getTelephone(), getPicture(), getSex(), getHuella1(), getHuella2());
    }

    @Override
    public String toString() {
        return "Empleado{" +
                "document=" + document +
                ", badgeAccess=" + badgeAccess +
                ", name='" + name + '\'' +
                ", lastname='" + lastName + '\'' +
                ", email='" + email + '\'' +
                ", enabled=" + enabled +
                ", telephone='" + telephone + '\'' +
                ", picture='" + picture + '\'' +
                ", sex='" + sex + '\'' +
                ", birthdate=" + birthDate +
                ", huella1='" + huella1 + '\'' +
                ", huella2='" + huella2 + '\'' +
                '}';
    }

    public List<PisoPermiso> getListPisos() {
        return listPisos;
    }

    public void setListPisos(List<PisoPermiso> listPisos) {
        this.listPisos = listPisos;
    }
}