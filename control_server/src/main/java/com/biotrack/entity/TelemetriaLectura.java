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

    @JsonProperty("bateria")
    public Integer bateria;

    @JsonProperty("estado_alerta")
    public int estado_alerta;

    @JsonProperty("gateway_id")
    public String gateway_id;

    @JsonProperty("gateway_ip")
    public String gateway_ip;

    @JsonProperty("piso_id")
    public Long piso_id;

    @JsonProperty("piso_numero")
    public String piso_numero;

    @JsonProperty("sede_id")
    public Long sede_id;

    @JsonProperty("sede_nombre")
    public String sede_nombre;

    @JsonProperty("timestamp")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    public Instant timestamp;

    public TelemetriaLectura() {
        this.bateria = 98;
        this.timestamp = Instant.now();
    }

    public TelemetriaLectura(String id_pulsera, int bpm, int spo2, double temp, int estado_alerta) {
        this.id_pulsera = id_pulsera;
        this.bpm = bpm;
        this.spo2 = spo2;
        this.temp = temp;
        this.bateria = 98;
        this.estado_alerta = estado_alerta;
        this.timestamp = Instant.now();
    }

    public TelemetriaLectura(String id_pulsera, int bpm, int spo2, double temp, Integer bateria, int estado_alerta,
                             String gateway_id, String gateway_ip, Long piso_id, String piso_numero,
                             Long sede_id, String sede_nombre) {
        this.id_pulsera = id_pulsera;
        this.bpm = bpm;
        this.spo2 = spo2;
        this.temp = temp;
        this.bateria = (bateria != null) ? bateria : 98;
        this.estado_alerta = estado_alerta;
        this.gateway_id = (gateway_id != null) ? gateway_id : "GW-MESH-01";
        this.gateway_ip = (gateway_ip != null) ? gateway_ip : "192.168.1.105";
        this.piso_id = piso_id;
        this.piso_numero = (piso_numero != null) ? piso_numero : "Piso 2";
        this.sede_id = sede_id;
        this.sede_nombre = (sede_nombre != null) ? sede_nombre : "Sede San Diego";
        this.timestamp = Instant.now();
    }

    public ObjectId getId() {
        return this.id;
    }
}
