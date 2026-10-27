package com.biotrack.entity;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;

@MongoEntity(collection = "usuarios")
public class UsuarioEntity extends PanacheMongoEntity {

    public String correo;
    public String claveEncriptada;
    public String rol;
    public boolean primerIngreso;
    public String fotogramaBase64;
    public String tipoMembresia;
    public String estadoPago;
    public String idPulseraAsignada;

    public UsuarioEntity() {
    }

    public static UsuarioEntity findByCorreo(String correo) {
        return find("correo", correo).firstResult();
    }
}
