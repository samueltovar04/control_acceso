package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;

import javax.persistence.Entity;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import java.io.Serializable;

@Entity
@Table(name="piso_permiso")
public class PisoPermiso extends AbstractEntity implements Serializable {
    private static final long serialVersionUID = 1L;
    @ManyToOne
    @JoinColumn(name = "piso_id",insertable = true, updatable = false, nullable = false)
    private Piso piso;

    @ManyToOne
    @JoinColumn(name = "badge_access", insertable = false, updatable = false,nullable = false)
    private Empleado empleado;
}
