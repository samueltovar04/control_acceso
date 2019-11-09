package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;
import com.fasterxml.jackson.annotation.JsonBackReference;

import javax.persistence.*;
import java.io.Serializable;

@Entity
@Table(name="piso_permiso")
public class PisoPermisoVisita extends AbstractEntity implements Serializable {
    private static final long serialVersionUID = 1L;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonBackReference(value = "visitaJson")
    @JoinColumn(name = "badge_access",referencedColumnName = "badge_access")
    private Visita visita;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonBackReference(value = "pisovJson")
    @JoinColumn(name = "piso_id",referencedColumnName = "id")
    private PisoVisita piso;

    private Long pisoId;

    public Long getPisoId() {
        return pisoId;
    }

    public void setPisoId(Long pisoId) {
        this.pisoId = pisoId;
    }

    public PisoPermisoVisita(PisoVisita piso,Integer state){
        this.piso=piso;
        this.setState(state);
    }

    public PisoVisita getPiso() {
        return piso;
    }

    public void setPiso(PisoVisita piso) {
        this.piso = piso;
    }

    public Visita getVisita() {
        return visita;
    }

    public void setVisita(Visita visita) {
        this.visita = visita;
    }
}
