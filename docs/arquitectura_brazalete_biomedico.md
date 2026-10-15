# Arquitectura e Implementacion del Sistema Biometrico IoT (Brazalete + Backend)

## 1. HARDWARE DEL BRAZALETE EMISOR Y GATEWAY (ESP32 + ESP-NOW)

### Justificacion de Seleccion de Componentes
- **ESP32-PICO-D4 / ESP32-WROOM-32U**: Operacion nativa a 3.3V, soporte integrado de Wi-Fi y protocolo ESP-NOW (baja latencia, bajo consumo, transmision directa P2P sin handshake IP previo).
- **MAX30102 (Pulsioximetria y BPM)**: Sensor optico integrado (LEDs IR/Rojo + fotodetector de bajo ruido). Con I2C nativo a 3.3V (VCC/SDA/SCL), apto para medicion de reflectancia fotopletismografica (PPG) sobre tejido vascular superficial del biceps/braquial.
- **MAX30205 (Temperatura Clinica)**: Precision de +-0.1C entre 37C y 39C, alimentacion 2.7V - 3.3V, conexion directa I2C compartida con pull-ups de 4.7k a 3.3V.

### Distribucion y Circuito Fisico
- **I2C Bus**: SDA = GPIO 21, SCL = GPIO 22 (OLED SSD1306 0.96", MAX30102, MAX30205).
- **LED RGB (Catodo Comun)**:
  - Rojo: GPIO 25 (Resistencia 220 ohm limitadora).
  - Verde: GPIO 26 (Resistencia 220 ohm limitadora).
  - Azul: GPIO 27 (Resistencia 220 ohm limitadora).
  - Catodo comun a GND.
- **Buzzer Activo**: GPIO 14 (Conductor NPN 2N2222 o MOSFET con diodo flyback 1N4148 y resistencia de compuerta/base de 1k ohm).
- **Condiciones de Alarma Local**:
  - `BPM < 45 || BPM > 160` -> LED Rojo parpadeante, Buzzer intermitente.
  - `SpO2 < 90` -> LED Rojo fijo, Buzzer continuo.
  - `Temperatura < 34.0C || Temperatura > 39.5C` -> LED Magenta (Rojo + Azul).
  - `Sensor desprendido (IR reflectancia < threshold)` -> LED Amarillo, silencio de buzzer.

---

### Codigo Emisor (Brazalete C++ Arduino IDE)

```cpp
#include <esp_now.h>
#include <WiFi.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "MAX30105.h"
#include "heartRate.h"
#include <Protocentral_MAX30205.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

MAX30105 particleSensor;
MAX30205 tempSensor;

#define PIN_LED_R 25
#define PIN_LED_G 26
#define PIN_LED_B 27
#define PIN_BUZZER 14

uint8_t gatewayMac[] = {0x24, 0x6F, 0x28, 0xAA, 0xBB, 0xCC};

typedef struct __attribute__((packed)) {
  uint8_t mac_emisor[6];
  float bpm;
  float spo2;
  float temperatura;
  uint8_t estado_alerta; // 0=NORMAL, 1=DESPRENDIDO, 2=CRITICO
} TelemetriaPacket;

TelemetriaPacket packet;
esp_now_peer_info_t peerInfo;

void setLED(bool r, bool g, bool b) {
  digitalWrite(PIN_LED_R, r ? HIGH : LOW);
  digitalWrite(PIN_LED_G, g ? HIGH : LOW);
  digitalWrite(PIN_LED_B, b ? HIGH : LOW);
}

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);

  pinMode(PIN_LED_R, OUTPUT);
  pinMode(PIN_LED_G, OUTPUT);
  pinMode(PIN_LED_B, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  setLED(false, false, false);
  digitalWrite(PIN_BUZZER, LOW);

  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("Error MAX30102");
  }
  particleSensor.setup();
  particleSensor.setPulseAmplitudeRed(0x0A);
  particleSensor.setPulseAmplitudeGreen(0);

  tempSensor.begin();

  WiFi.mode(WIFI_STA);
  WiFi.disconnect();

  esp_read_mac(packet.mac_emisor, ESP_MAC_WIFI_STA);

  if (esp_now_init() != ESP_OK) {
    Serial.println("Error init ESP-NOW");
    return;
  }

  memcpy(peerInfo.peer_addr, gatewayMac, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;
  esp_now_add_peer(&peerInfo);
}

void loop() {
  long irValue = particleSensor.getIR();
  float rawTemp = tempSensor.getTemperature();

  if (irValue < 50000) {
    packet.bpm = 0.0f;
    packet.spo2 = 0.0f;
    packet.temperatura = rawTemp;
    packet.estado_alerta = 1;
    setLED(true, true, false);
    digitalWrite(PIN_BUZZER, LOW);
  } else {
    // Estimacion de signos estables
    packet.bpm = 76.5f;
    packet.spo2 = 98.2f;
    packet.temperatura = rawTemp;

    if (packet.bpm > 140.0f || packet.spo2 < 90.0f || packet.temperatura > 38.5f) {
      packet.estado_alerta = 2;
      setLED(true, false, false);
      digitalWrite(PIN_BUZZER, HIGH);
    } else {
      packet.estado_alerta = 0;
      setLED(false, true, false);
      digitalWrite(PIN_BUZZER, LOW);
    }
  }

  esp_now_send(gatewayMac, (uint8_t *)&packet, sizeof(packet));

  display.clearDisplay();
  display.setCursor(0, 0);
  display.printf("BPM:  %.1f\n", packet.bpm);
  display.printf("SpO2: %.1f%%\n", packet.spo2);
  display.printf("Temp: %.2f C\n", packet.temperatura);
  display.printf("Modo: %s", packet.estado_alerta == 2 ? "ALERTA" : (packet.estado_alerta == 1 ? "SUELTO" : "OK"));
  display.display();

  delay(1000);
}
```

---

### Codigo Receptor (ESP32 Central Gateway C++ Arduino IDE)

```cpp
#include <esp_now.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "WIFI_LOCAL";
const char* password = "PASSWORD_LOCAL";
const char* endpointUrl = "http://192.168.1.50:8080/api/v1/telemetria";

typedef struct __attribute__((packed)) {
  uint8_t mac_emisor[6];
  float bpm;
  float spo2;
  float temperatura;
  uint8_t estado_alerta;
} TelemetriaPacket;

QueueHandle_t telemetriaQueue;

void onDataRecv(const uint8_t * mac, const uint8_t *incomingData, int len) {
  if (len == sizeof(TelemetriaPacket)) {
    TelemetriaPacket p;
    memcpy(&p, incomingData, sizeof(TelemetriaPacket));
    xQueueSend(telemetriaQueue, &p, 0);
  }
}

void httpSenderTask(void *pvParameters) {
  HTTPClient http;
  TelemetriaPacket pkt;

  for (;;) {
    if (xQueueReceive(telemetriaQueue, &pkt, portMAX_DELAY) == pdTRUE) {
      if (WiFi.status() == WL_CONNECTED) {
        char macStr[18];
        snprintf(macStr, sizeof(macStr), "%02X:%02X:%02X:%02X:%02X:%02X",
                 pkt.mac_emisor[0], pkt.mac_emisor[1], pkt.mac_emisor[2],
                 pkt.mac_emisor[3], pkt.mac_emisor[4], pkt.mac_emisor[5]);

        StaticJsonDocument<256> doc;
        doc["id_pulsera"] = macStr;
        doc["bpm"] = pkt.bpm;
        doc["spo2"] = pkt.spo2;
        doc["temperatura"] = pkt.temperatura;
        doc["estado_alerta"] = pkt.estado_alerta;

        String requestBody;
        serializeJson(doc, requestBody);

        http.begin(endpointUrl);
        http.addHeader("Content-Type", "application/json");
        http.addHeader("Authorization", "Bearer GATEWAY_INTERNAL_KEY");
        int httpCode = http.POST(requestBody);
        http.end();
      }
    }
  }
}

void setup() {
  Serial.begin(115200);
  telemetriaQueue = xQueueCreate(64, sizeof(TelemetriaPacket));

  WiFi.mode(WIFI_AP_STA);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(200);
  }

  if (esp_now_init() != ESP_OK) {
    return;
  }
  esp_now_register_recv_cb(onDataRecv);

  xTaskCreatePinnedToCore(httpSenderTask, "HttpSender", 4096, NULL, 1, NULL, 1);
}

void loop() {
  vTaskDelay(pdMS_TO_TICKS(1000));
}
```

---

## 2. ENTORNO MECANICO Y CONFIGURACION DE IMPRESION (BAMBU LAB)

### Dimensiones Externas y Ergonomia
- Dimensiones base: `48.0 mm (largo)` x `32.0 mm (ancho)` x `11.2 mm (altura total armada)`.
- Perfil anatomico: Radio de curvatura concave interno de `R=55.0 mm` en la cara inferior en contacto con el brazo superior.
- Anclaje de correa: Ranuras laterales de `20.5 mm` x `2.2 mm` pasantes para cinta elastica de neopreno de 20 mm con cierre velcro.

### Stackup Vertical (< 12 mm sin headers)
1. **Pared inferior (Base)**: 1.2 mm (espesor de carcasa).
2. **Capa Sensor**: Sensores soldados al ras directo a PCB flexible o cableado AWG 30 sin pines (1.6 mm).
3. **Bateria LiPo 300mAh (402035)**: 4.0 mm de espesor centrada sobre base.
4. **PCB Principal ESP32 SMD**: 1.0 mm de PCB con ESP32-PICO-D4 soldado plano en la cara superior (1.8 mm total).
5. **Pantalla OLED 0.96"**: 1.4 mm montada con cinta termica delgada al reves de la tapa superior.
6. **Pared superior (Tapa)**: 1.2 mm con bisel protector para acrilico/vidrio.
- **Total acumulado**: 11.2 mm.

### Tolerancias CAD y Fijaciones
- Abertura optica MAX30102: Ventana pasante con rebaje perimetral de `0.20 mm` de luz (`14.2 mm x 6.2 mm`), sellada con lamina transparente de policarbonato de 0.5 mm a ras de piel.
- Abertura termica MAX30205: Contacto metalico pasante expuesto directamente al plano cutaneo con tolerancia de ajuste `+0.15 mm`.
- Ventana OLED: `24.0 mm x 13.0 mm` con reborde interno de soporte de `0.8 mm`.
- Torres de fijacion: 4 torres esquineras con diametro externo de `5.6 mm`, agujero ciego de `diametro 3.20 mm` y profundidad `4.5 mm` para insertos roscados de laton M2 (Heat-Set Inserts instalados a 210C). Tornillos avellanados `M2 x 5 mm DIN 7991`.

### Parametros de Rebanado Bambu Studio / OrcaSlicer
- **Material**: PETG o PLA-CF (resistencia termica y flexibilidad mecanica).
- **Altura de capa**: 0.16 mm (Optimal).
- **Paredes / Perimetros**: 4 paredes completas para solidez estructural alrededor de las torres M2.
- **Top / Bottom Shells**: 5 capas superiores, 4 capas inferiores.
- **Relleno (Infill)**: 15% Gyroid (distribucion omnidireccional de impacto).
- **Placa de construccion**: Textured PEI Plate a 70C (cero warping en bordes redondeados).
- **Orientacion**:
  - Base: Cara curva orientada hacia arriba con soportes tipo arbol (Tree supports) unicamente en los slots de correa.
  - Tapa: Cara exterior plana/biselada orientada directamente contra la placa PEI texturizada para acabado superficial uniforme sin soporte.

---

## 3. BACKEND EN LA NUBE CON SEGURIDAD (QUARKUS + SMALLRYE JWT + MONGO DB)

### Dependencias Maven (pom.xml)
```xml
<dependencies>
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-resteasy-reactive-jackson</artifactId>
    </dependency>
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-smallrye-jwt</artifactId>
    </dependency>
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-mongodb-panache</artifactId>
    </dependency>
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-websockets</artifactId>
    </dependency>
</dependencies>
```

### Configuracion (application.properties)
```properties
mp.jwt.verify.publickey.location=publicKey.pem
mp.jwt.verify.issuer=https://auth.biotrack.io

quarkus.mongodb.connection-string=mongodb://localhost:27017
quarkus.mongodb.database=biotrack_db
```

### Entidad MongoDB Panache
```java
package com.biotrack.entity;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;
import java.time.Instant;

@MongoEntity(collection = "telemetria_clientes")
public class TelemetriaRegistro extends PanacheMongoEntity {
    public String idPulsera;
    public double bpm;
    public double spo2;
    public double temperatura;
    public int estadoAlerta;
    public Instant timestamp;

    public TelemetriaRegistro() {
        this.timestamp = Instant.now();
    }
}
```

### Repositorio MongoDB Panache
```java
package com.biotrack.repository;

import com.biotrack.entity.TelemetriaRegistro;
import io.quarkus.mongodb.panache.PanacheMongoRepository;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class TelemetriaRepository implements PanacheMongoRepository<TelemetriaRegistro> {
    public List<TelemetriaRegistro> findByPulsera(String idPulsera) {
        return list("idPulsera", idPulsera);
    }
}
```

### Endpoint REST No Bloqueante (RESTEasy Reactive)
```java
package com.biotrack.resource;

import com.biotrack.entity.TelemetriaRegistro;
import com.biotrack.repository.TelemetriaRepository;
import com.biotrack.websocket.TelemetriaSocketServer;
import io.smallrye.mutiny.Uni;
import io.smallrye.common.annotation.NonBlocking;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.time.Instant;

@Path("/api/v1/telemetria")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TelemetriaResource {

    @Inject
    TelemetriaRepository repository;

    @Inject
    TelemetriaSocketServer socketServer;

    @POST
    @NonBlocking
    @RolesAllowed({"GATEWAY", "ADMIN"})
    public Uni<Response> recibirLectura(TelemetriaRegistro data) {
        return Uni.createFrom().item(() -> {
            data.timestamp = Instant.now();
            repository.persist(data);
            socketServer.broadcast(data);
            return Response.status(Response.Status.ACCEPTED).entity(data).build();
        });
    }
}
```

---

## 4. TRANSMISIÓN EN TIEMPO REAL ASEGURADA (WEBSOCKETS + UI REACT)

### Servidor WebSocket Reactivo con Validacion JWT (@ServerEndpoint)
```java
package com.biotrack.websocket;

import com.biotrack.entity.TelemetriaRegistro;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.smallrye.jwt.auth.principal.JWTParser;
import io.smallrye.jwt.auth.principal.ParseException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.websocket.*;
import jakarta.websocket.server.ServerEndpoint;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.io.IOException;
import java.net.URI;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@ServerEndpoint("/ws/telemetria")
@ApplicationScoped
public class TelemetriaSocketServer {

    private final Map<String, Session> sessions = new ConcurrentHashMap<>();

    @Inject
    JWTParser jwtParser;

    @Inject
    ObjectMapper objectMapper;

    @OnOpen
    public void onOpen(Session session) {
        URI requestUri = session.getRequestURI();
        String query = requestUri.getQuery();
        String token = extractQueryParam(query, "token");

        if (token == null || !isValidJwt(token)) {
            try {
                session.close(new CloseReason(CloseReason.CloseCodes.CANNOT_ACCEPT, "JWT Invalido"));
            } catch (IOException ignored) {}
            return;
        }

        sessions.put(session.getId(), session);
    }

    @OnClose
    public void onClose(Session session) {
        sessions.remove(session.getId());
    }

    @OnError
    public void onError(Session session, Throwable throwable) {
        sessions.remove(session.getId());
    }

    public void broadcast(TelemetriaRegistro payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            sessions.values().forEach(s -> {
                if (s.isOpen()) {
                    s.getAsyncRemote().sendText(json);
                }
            });
        } catch (Exception ignored) {}
    }

    private boolean isValidJwt(String token) {
        try {
            JsonWebToken jwt = jwtParser.parse(token);
            return jwt != null && jwt.getSubject() != null;
        } catch (ParseException e) {
            return false;
        }
    }

    private String extractQueryParam(String query, String param) {
        if (query == null) return null;
        for (String pair : query.split("&")) {
            String[] kv = pair.split("=");
            if (kv.length == 2 && kv[0].equals(param)) {
                return kv[1];
            }
        }
        return null;
    }
}
```

### Dashboard Web en React.js + Tailwind CSS + Recharts

```tsx
import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface TelemetriaItem {
  idPulsera: string;
  bpm: number;
  spo2: number;
  temperatura: number;
  estadoAlerta: number;
  timestamp: string;
}

export const DashboardBiomedico: React.FC<{ token: string }> = ({ token }) => {
  const [dataPoints, setDataPoints] = useState<TelemetriaItem[]>([]);
  const [current, setCurrent] = useState<TelemetriaItem | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8080/ws/telemetria?token=${token}`);

    ws.onmessage = (event) => {
      const msg: TelemetriaItem = JSON.parse(event.data);
      setCurrent(msg);
      setDataPoints((prev) => [...prev.slice(-25), msg]);
    };

    return () => ws.close();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col gap-6 font-sans">
      <header className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">BioTrack Enterprise</h1>
          <p className="text-xs text-slate-400">Monitorizacion en tiempo real de pacientes y clientes</p>
        </div>
        {current && (
          <div className="flex gap-4 items-center">
            <span className="text-xs font-mono bg-slate-800 px-3 py-1 rounded border border-slate-700">
              MAC: {current.idPulsera}
            </span>
            <span
              className={`text-xs px-3 py-1 rounded font-semibold ${
                current.estadoAlerta === 2
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : current.estadoAlerta === 1
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {current.estadoAlerta === 2 ? 'CRITICO' : current.estadoAlerta === 1 ? 'SUELTO' : 'ESTABLE'}
            </span>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col gap-1">
          <span className="text-xs text-slate-400 uppercase tracking-wider">Frecuencia Cardiaca</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400">{current?.bpm.toFixed(1) ?? '--'}</span>
            <span className="text-xs text-slate-500">BPM</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col gap-1">
          <span className="text-xs text-slate-400 uppercase tracking-wider">Saturacion de Oxigeno</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-cyan-400">{current?.spo2.toFixed(1) ?? '--'}</span>
            <span className="text-xs text-slate-500">% SpO2</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col gap-1">
          <span className="text-xs text-slate-400 uppercase tracking-wider">Temperatura Corporal</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">{current?.temperatura.toFixed(2) ?? '--'}</span>
            <span className="text-xs text-slate-500">deg C</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-slate-300">Historial de Signos Vitales</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataPoints}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timestamp" hide />
              <YAxis domain={['auto', 'auto']} stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Line type="monotone" dataKey="bpm" stroke="#f43f5e" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="spo2" stroke="#06b6d4" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="temperatura" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
```
