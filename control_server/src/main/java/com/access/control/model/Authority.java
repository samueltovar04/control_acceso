package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "authorities")
public class Authority extends AbstractEntity {

    private String name; // ROLE_ADMIN, ROLE_EMPLEADO, ROLE_CLIENTE, ROLE_RECEPCION, ROLE_TECNICO

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
