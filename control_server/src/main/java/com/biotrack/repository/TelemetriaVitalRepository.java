package com.biotrack.repository;

import com.biotrack.entity.TelemetriaVitalEntity;
import io.quarkus.mongodb.panache.PanacheMongoRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class TelemetriaVitalRepository implements PanacheMongoRepository<TelemetriaVitalEntity> {

    public List<TelemetriaVitalEntity> findByPulsera(String idPulsera) {
        return find("id_pulsera", idPulsera).list();
    }

    public List<TelemetriaVitalEntity> findAlertasActivas() {
        return find("alerta", 1).list();
    }
}
