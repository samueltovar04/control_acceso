package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;

import javax.persistence.Entity;
import javax.persistence.Table;
import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name="pisos")
public class  PisoVisita extends AbstractEntity implements Serializable {

        private static final long serialVersionUID = 1L;
        private String piso;
        private String descripcion;
        private String area;

        public PisoVisita() {
        }

        public String getDescripcion() {
            return descripcion;
        }

        public void setDescripcion(String descripcion) {
            this.descripcion = descripcion;
        }

        public String getPiso() {
            return piso;
        }

        public void setPiso(String piso) {
            this.piso = piso;
        }

        public String getArea() {
            return area;
        }

        public void setArea(String area) {
            this.area = area;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof PisoVisita)) return false;
            PisoVisita piso1 = (PisoVisita) o;
            return Objects.equals(getPiso(), piso1.getPiso()) &&
                    Objects.equals(getArea(), piso1.getArea());
        }

        @Override
        public int hashCode() {
            return Objects.hash(getPiso(), getArea());
        }

        @Override
        public String toString() {
            return "Piso{" +
                    "piso='" + piso + '\'' +
                    ", area='" + area + '\'' +
                    '}';
        }
    }
