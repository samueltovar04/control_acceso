package com.biotrack.entity;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;
import java.time.LocalDateTime;

@MongoEntity(collection = "telemetria_signos_vitales")
public class TelemetriaVitalEntity extends PanacheMongoEntity {

    public String id_pulsera;
    public Integer bpm;
    public Integer spo2;
    public Double temp;
    public Integer alerta;
    public LocalDateTime timestamp;

    public TelemetriaVitalEntity() {
        this.timestamp = LocalDateTime.now();
    }

    public TelemetriaVitalEntity(String id_pulsera, Integer bpm, Integer spo2, Double temp, Integer alerta) {
        this.id_pulsera = id_pulsera;
        this.bpm = bpm;
        this.spo2 = spo2;
        this.temp = temp;
        this.alerta = alerta;
        this.timestamp = LocalDateTime.now();
    }
}
