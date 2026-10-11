package com.access.control.dto;

import java.util.Date;
import java.util.List;

public class VisitaDto {
    private Long id;
    private String documento;
    private String nombre;
    private String apellido;
    private String email;
    private String telefono;
    private String foto;
    private String sexo;
    private Date fechaNacimiento;
    private Date fechaIngreso;
    private Date fechaSalida;
    private Long empleadoId;
    private List<Long> pisoIds;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public Long getEmpleadoId() { return empleadoId; }
    public void setEmpleadoId(Long empleadoId) { this.empleadoId = empleadoId; }

    public List<Long> getPisoIds() { return pisoIds; }
    public void setPisoIds(List<Long> pisoIds) { this.pisoIds = pisoIds; }
}
