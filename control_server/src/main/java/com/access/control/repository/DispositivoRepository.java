package com.access.control.repository;

import com.access.control.model.Dispositivo;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class DispositivoRepository implements PanacheRepository<Dispositivo> {
    public Dispositivo findByIp(String ip) {
        return find("ip", ip).firstResult();
    }
}
