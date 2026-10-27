package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "piso_permiso")
public class PisoPermiso extends AbstractEntity {

    @Column(name = "badge_access")
    private Integer badgeAccess;

    @Column(name = "pisoid")
    private Long pisoIdLegacy;

    @ManyToOne
    @JoinColumn(name = "piso_id")
    private Piso piso;

    @ManyToOne
    @JoinColumn(name = "badge_access", referencedColumnName = "badge_access", insertable = false, updatable = false)
    private Empleado empleado;

    public Integer getBadgeAccess() { return badgeAccess; }
    public void setBadgeAccess(Integer badgeAccess) { this.badgeAccess = badgeAccess; }

    public Long getPisoIdLegacy() { return pisoIdLegacy; }
    public void setPisoIdLegacy(Long pisoIdLegacy) { this.pisoIdLegacy = pisoIdLegacy; }

    public Piso getPiso() { return piso; }
    public void setPiso(Piso piso) { this.piso = piso; }

    public Empleado getEmpleado() { return empleado; }
    public void setEmpleado(Empleado empleado) { this.empleado = empleado; }
}
