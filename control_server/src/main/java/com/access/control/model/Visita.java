package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;
import jakarta.persistence.*;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "visitas")
public class Visita extends AbstractEntity {

    private String documento;
    private String nombre;
    private String apellido;
    private String email;
    private String telefono;
    private String foto;
    private String sexo;

    @Temporal(TemporalType.DATE)
    private Date fechaNacimiento;

    @Temporal(TemporalType.TIMESTAMP)
    private Date fechaIngreso;

    @Temporal(TemporalType.TIMESTAMP)
    private Date fechaSalida;

    @ManyToOne
    private Empleado empleadoAVisitar;

    @ManyToMany(fetch = FetchType.LAZY)
    private List<Piso> pisosPermitidos;

    public String getDocumento() { return documento; }
    public void setDocumento(String documento) { this.documento = documento; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getApellido() { return apellido; }
    public void setApellido(String apellido) { this.apellido = apellido; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getFoto() { return foto; }
    public void setFoto(String foto) { this.foto = foto; }

    public String getSexo() { return sexo; }
    public void setSexo(String sexo) { this.sexo = sexo; }

    public Date getFechaNacimiento() { return fechaNacimiento; }
    public void setFechaNacimiento(Date fechaNacimiento) { this.fechaNacimiento = fechaNacimiento; }

    public Date getFechaIngreso() { return fechaIngreso; }
    public void setFechaIngreso(Date fechaIngreso) { this.fechaIngreso = fechaIngreso; }

    public Date getFechaSalida() { return fechaSalida; }
    public void setFechaSalida(Date fechaSalida) { this.fechaSalida = fechaSalida; }

    public Empleado getEmpleadoAVisitar() { return empleadoAVisitar; }
    public void setEmpleadoAVisitar(Empleado empleadoAVisitar) { this.empleadoAVisitar = empleadoAVisitar; }

    public List<Piso> getPisosPermitidos() { return pisosPermitidos; }
    public void setPisosPermitidos(List<Piso> pisosPermitidos) { this.pisosPermitidos = pisosPermitidos; }
}
