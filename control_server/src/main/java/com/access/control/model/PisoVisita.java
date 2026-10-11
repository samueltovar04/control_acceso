package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "piso_visitas")
public class PisoVisita extends AbstractEntity {

    @ManyToOne
    private Piso piso;

    @ManyToOne
    private Visita visita;

    public Piso getPiso() { return piso; }
    public void setPiso(Piso piso) { this.piso = piso; }

    public Visita getVisita() { return visita; }
    public void setVisita(Visita visita) { this.visita = visita; }
}
