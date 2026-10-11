package com.access.control.dto;

import java.util.Date;
import java.util.List;

public class EmpleadoDto {
    private Long id;
    private String documento;
    private String codigoInsignia;
    private String nombre;
    private String apellido;
    private String email;
    private String telefono;
    private String foto;
    private String sexo;
    private Date fechaNacimiento;
    private String huella1;
    private String huella2;
    private String faceVector;
    private Long gerenciaId;
    private Long tipoContratoId;
    private Long sedeId;
    private List<Long> pisoIds;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDocumento() { return documento; }
    public void setDocumento(String documento) { this.documento = documento; }

    public String getCodigoInsignia() { return codigoInsignia; }
    public void setCodigoInsignia(String codigoInsignia) { this.codigoInsignia = codigoInsignia; }

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

    public String getHuella1() { return huella1; }
    public void setHuella1(String huella1) { this.huella1 = huella1; }

    public String getHuella2() { return huella2; }
    public void setHuella2(String huella2) { this.huella2 = huella2; }

    public String getFaceVector() { return faceVector; }
    public void setFaceVector(String faceVector) { this.faceVector = faceVector; }

    public Long getGerenciaId() { return gerenciaId; }
    public void setGerenciaId(Long gerenciaId) { this.gerenciaId = gerenciaId; }

    public Long getTipoContratoId() { return tipoContratoId; }
    public void setTipoContratoId(Long tipoContratoId) { this.tipoContratoId = tipoContratoId; }

    public Long getSedeId() { return sedeId; }
    public void setSedeId(Long sedeId) { this.sedeId = sedeId; }

    public List<Long> getPisoIds() { return pisoIds; }
    public void setPisoIds(List<Long> pisoIds) { this.pisoIds = pisoIds; }
}
