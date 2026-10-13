package com.biotrack.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;
import org.bson.types.ObjectId;

import java.time.Instant;

@MongoEntity(collection = "telemetria_lecturas")
@JsonIgnoreProperties(ignoreUnknown = true)
public class TelemetriaLectura extends PanacheMongoEntity {

    @JsonProperty("id_pulsera")
    public String id_pulsera;

    @JsonProperty("bpm")
    public int bpm;

    @JsonProperty("spo2")
    public int spo2;

    @JsonProperty("temp")
    public double temp;

    @JsonProperty("estado_alerta")
    public int estado_alerta;

    @JsonProperty("timestamp")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    public Instant timestamp;

    public TelemetriaLectura() {
        this.timestamp = Instant.now();
    }

    public TelemetriaLectura(String id_pulsera, int bpm, int spo2, double temp, int estado_alerta) {
        this.id_pulsera = id_pulsera;
        this.bpm = bpm;
        this.spo2 = spo2;
        this.temp = temp;
        this.estado_alerta = estado_alerta;
        this.timestamp = Instant.now();
    }

    public ObjectId getId() {
        return this.id;
    }
}
