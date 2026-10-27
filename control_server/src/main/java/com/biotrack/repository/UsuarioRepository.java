package com.biotrack.repository;

import com.biotrack.entity.UsuarioEntity;
import io.quarkus.mongodb.panache.PanacheMongoRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class UsuarioRepository implements PanacheMongoRepository<UsuarioEntity> {

    public UsuarioEntity findByCorreo(String correo) {
        return find("correo", correo).firstResult();
    }
}
