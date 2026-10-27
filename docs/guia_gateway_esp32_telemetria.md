# Guía de Integración Gateway IoT ESP32 Wi-Fi + ESP-NOW -> BioTrack / Control de Acceso

Este documento detalla la arquitectura completa de hardware, firmware y protocolos de comunicación para enlazar los dispositivos biomédicos:

1. **Nodos Emisores (Pulseras Wearable con ESP32 / ESP32-C3 / ESP8266)** comunicándose por **ESP-NOW** (protocolo inalámbrico de ultra baja latencia y consumo mínimo sin necesidad de router).
2. **Gateway Concentrador Físico (ESP32)** con antena Wi-Fi dual / STA que recibe las tramas ESP-NOW de todas las pulseras en el área y las despacha vía **HTTP POST (JSON)** al servidor Quarkus.
3. **Backend Quarkus + MongoDB + WebSockets** procesando y mostrando en tiempo real en los monitores y apps móviles.

---

## 1. Diagrama de Arquitectura ESP-NOW -> Gateway -> Quarkus

```text
┌────────────────────────┐      ┌────────────────────────┐
│  PULSERA_001 (Wearable) │      │  PULSERA_002 (Wearable) │
│   MAX30102 + DS18B20   │      │   MAX30102 + DS18B20   │
│   ESP32 (Transmisor)   │      │   ESP32 (Transmisor)   │
└───────────┬────────────┘      └───────────┬────────────┘
            │                               │
            │ ESP-NOW (Canal Wi-Fi fijo)    │ ESP-NOW (Canal Wi-Fi fijo)
            │ Paquetes binarios directos    │ (< 5 ms, sin handshake Wi-Fi)
            └───────────────┬───────────────┘
                            ▼
              ┌───────────────────────────┐
              │   GATEWAY FÍSICO ESP32    │
              │  Modo Dual: ESP-NOW + STA │
              │   MAC: A4:CF:12:85:90:3C  │
              └─────────────┬─────────────┘
                            │
                            │ HTTP POST (application/json)
                            │ Wi-Fi LAN / Ethernet
                            ▼
              ┌───────────────────────────┐
              │   SERVIDOR QUARKUS 3.x    │
              │   /api/v1/telemetria/     │
              │      gateway-ingest       │
              └─────────────┬─────────────┘
                            ├─► MongoDB (biotrack_db)
                            └─► WebSockets (/ws/signos-vitales)
                                      │
                                      ▼
                        [ Dashboards & Apps Móviles ]
```

---

## 2. Estructura de Datos Compartida (C / C++ Struct)

Para que el Gateway y las Pulseras se entiendan por ESP-NOW, ambos firmwares deben compartir exactamente la misma estructura de memoria en C:

```cpp
typedef struct struct_telemetria {
    char id_pulsera[16];   // "PULSERA_001", "PULSERA_002", etc.
    float bpm;             // Pulsaciones por minuto (ej: 72.5)
    float spo2;            // Saturacion Oxigeno (ej: 98.0)
    float temp;            // Temperatura en Celsius (ej: 36.6)
    uint8_t estado_alerta; // 0 = Normal, 1 = Alerta Critica
} struct_telemetria;
```

---

## 3. Firmware de las Pulseras (Transmisores ESP-NOW)

Este código se carga en cada una de las pulseras (`PULSERA_001`, `PULSERA_002`, etc.).

### Requisitos

1. Conocer la dirección MAC del Gateway físico (obtenida ejecutando `WiFi.macAddress()` en el Gateway).
2. Estar configurado en el mismo canal Wi-Fi del router que usa el Gateway (usualmente canal 1 o 6).

### Código C++ para Pulsera Wearable

```cpp
#include <esp_now.h>
#include <WiFi.h>

// 1. MAC Address del Gateway fisico ESP32 receptor (Ajustar a la MAC real de tu Gateway)
uint8_t gatewayMacAddress[] = {0xA4, 0xCF, 0x12, 0x85, 0x90, 0x3C};

// 2. Estructura identica al Gateway
typedef struct struct_telemetria {
    char id_pulsera[16];
    float bpm;
    float spo2;
    float temp;
    uint8_t estado_alerta;
} struct_telemetria;

struct_telemetria lecturaPulsera;
esp_now_peer_info_t peerInfo;

// Identificador único de este dispositivo (coincide con codigoInsignia en el sistema)
const char* ID_DISPOSITIVO = "PULSERA_001"; // Cambiar a "PULSERA_002" en el segundo chip

// Callback de estado de envio
void onDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {
  Serial.print("[ESP-NOW Pulsera] Estado entrega: ");
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "ENTREGADO EXITOSO" : "FALLO DE ENVIO");
}

void setup() {
  Serial.begin(115200);

  // Configurar Wi-Fi en modo Station (requerido para ESP-NOW)
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();

  // Inicializar ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println("Error inicializando ESP-NOW");
    return;
  }

  // Registrar callback
  esp_now_register_send_cb(onDataSent);

  // Registrar el Gateway como Peer receptor
  memcpy(peerInfo.peer_addr, gatewayMacAddress, 6);
  peerInfo.channel = 0; // Mismo canal de recepcion
  peerInfo.encrypt = false; // Sin encriptacion para maxima velocidad

  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("Fallo al registrar peer Gateway");
    return;
  }

  strncpy(lecturaPulsera.id_pulsera, ID_DISPOSITIVO, sizeof(lecturaPulsera.id_pulsera));
  Serial.printf("Pulsera inicializada con ID: %s\n", ID_DISPOSITIVO);
}

void loop() {
  // AQUI: Leer sensores reales (ej: sensor MAX30102 via I2C y DS18B20 via OneWire)
  // Ejemplo con valores medidos / simulacion activa:
  lecturaPulsera.bpm = 70.0 + random(-3, 6);
  lecturaPulsera.spo2 = 97.0 + random(0, 3);
  lecturaPulsera.temp = 36.4 + (random(0, 5) * 0.1);
  
  // Alerta automatica si los valores escapan de rangos seguros
  if (lecturaPulsera.bpm > 140 || lecturaPulsera.spo2 < 90 || lecturaPulsera.temp > 38.3) {
    lecturaPulsera.estado_alerta = 1;
  } else {
    lecturaPulsera.estado_alerta = 0;
  }

  // Enviar paquete via ESP-NOW directamente al Gateway
  esp_err_t result = esp_now_send(gatewayMacAddress, (uint8_t *) &lecturaPulsera, sizeof(lecturaPulsera));

  if (result == ESP_OK) {
    Serial.printf("[%s] Enviado -> BPM: %.1f | SpO2: %.1f | Temp: %.2fC | Alerta: %d\n",
                  lecturaPulsera.id_pulsera, lecturaPulsera.bpm, lecturaPulsera.spo2, lecturaPulsera.temp, lecturaPulsera.estado_alerta);
  } else {
    Serial.println("Error al despachar paquete ESP-NOW");
  }

  // Frecuencia de muestreo (1 segundo entre envios)
  delay(1000);
}
```

---

## 4. Firmware del Gateway Concentrador Físico (ESP32)

El Gateway opera en modo **Híbrido**:

- Escucha pasivamente en **ESP-NOW** las tramas recibidas de cualquier pulsera cercana.
- Mantiene conexión **Wi-Fi Station** a tu red local para hacer **HTTP POST** con el JSON correspondiente al servidor Quarkus.

### Código C++ para Gateway ESP32

### Firmware de Alta Concurrencia para Gateway ESP32

```cpp
#include <esp_now.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Credenciales Wi-Fi de la red local donde corre el servidor
const char* ssid = "TU_RED_WIFI";
const char* password = "TU_PASSWORD_WIFI";

// URL del Endpoint Quarkus
const char* serverUrl = "http://192.168.1.140:8080/api/v1/telemetria/gateway-ingest";

// Estructura identica de recepcion ESP-NOW
typedef struct struct_telemetria {
    char id_pulsera[16];
    float bpm;
    float spo2;
    float temp;
    uint8_t estado_alerta;
} struct_telemetria;

struct_telemetria lecturaRecibida;

// Callback que se dispara inmediatamente al recibir un paquete de cualquier pulsera
void onDataRecv(const uint8_t * mac, const uint8_t *incomingData, int len) {
  memcpy(&lecturaRecibida, incomingData, sizeof(lecturaRecibida));

  Serial.printf("\n[ESP-NOW RX] De MAC: %02X:%02X:%02X:%02X:%02X:%02X\n",
                mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  Serial.printf("Dispositivo: %s | BPM: %.1f | SpO2: %.1f | Temp: %.2f | Alerta: %d\n",
                lecturaRecibida.id_pulsera, lecturaRecibida.bpm, lecturaRecibida.spo2, lecturaRecibida.temp, lecturaRecibida.estado_alerta);

  // Reenviar de inmediato por HTTP al Backend
  enviarAlBackend(lecturaRecibida);
}

void enviarAlBackend(struct_telemetria datos) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    // Construir el JSON exacto para Quarkus
    StaticJsonDocument<256> doc;
    doc["id_pulsera"] = datos.id_pulsera;
    doc["bpm"] = datos.bpm;
    doc["spo2"] = datos.spo2;
    doc["temp"] = datos.temp;
    doc["estado_alerta"] = datos.estado_alerta;

    String jsonPayload;
    serializeJson(doc, jsonPayload);

    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode == HTTP_CODE_ACCEPTED || httpResponseCode == HTTP_CODE_OK) {
      Serial.printf("[HTTP SERVER OK] Reenviado a Quarkus (HTTP %d)\n", httpResponseCode);
    } else {
      Serial.printf("[HTTP ERROR] Fallo reenvio a Quarkus: %d\n", httpResponseCode);
    }

    http.end();
  } else {
    Serial.println("[GATEWAY WARN] Wi-Fi desconectado. Reconectando...");
  }
}

void setup() {
  Serial.begin(115200);

  // 1. Conectar a la red Wi-Fi para acceso al servidor
  WiFi.mode(WIFI_AP_STA); // AP_STA permite mantener ESP-NOW y conexion al Router simultaneamente
  WiFi.begin(ssid, password);

  Serial.print("Conectando Gateway a Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n[GATEWAY ONLINE] Conectado a Wi-Fi!");
  Serial.print("Direccion IP asignada: ");
  Serial.println(WiFi.localIP());
  Serial.print("DIRECCION MAC DEL GATEWAY (Copiar en las pulseras): ");
  Serial.println(WiFi.macAddress());

  // 2. Inicializar protocolo ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println("[ERROR] No se pudo inicializar ESP-NOW en el Gateway");
    return;
  }

  // 3. Registrar callback de recepcion continua
  esp_now_register_recv_cb(onDataRecv);
  Serial.println("[GATEWAY LISTO] Escuchando pulseras por ESP-NOW...");
}

void loop() {
  // Mantener conexion Wi-Fi viva si ocurre desconexion del router
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
    delay(5000);
  }
  delay(100);
}
```

```cpp
#include <esp_now.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "TU_RED_WIFI";
const char* password = "TU_PASSWORD_WIFI";
const char* serverUrl = "http://192.168.1.140:8080/api/v1/telemetria/gateway-ingest";

typedef struct struct_telemetria {
    char id_pulsera[16];
    float bpm;
    float spo2;
    float temp;
    uint8_t estado_alerta;
} struct_telemetria;

// Cola FreeRTOS con capacidad para retener hasta 50 lecturas concurrentes en RAM
QueueHandle_t telemetriaQueue;

// 1. PRODUCTOR (Se ejecuta en Core 0 de inmediato al llegar radiofrecuencia)
void onDataRecv(const uint8_t * mac, const uint8_t *incomingData, int len) {
  struct_telemetria lectura;
  memcpy(&lectura, incomingData, sizeof(lectura));

  // Encolar de inmediato sin bloquear la radio (toma < 2 microsegundos)
  if (xQueueSend(telemetriaQueue, &lectura, (TickType_t)0) != pdPASS) {
    Serial.println("[GATEWAY WARN] Cola llena: paquete descartado por sobrecarga");
  }
}

// 2. CONSUMIDOR (Tarea dedicada en Core 1 para despachar HTTP)
void httpDispatchTask(void * pvParameters) {
  struct_telemetria datos;
  HTTPClient http;

  for(;;) {
    // Espera hasta que haya un elemento en la cola
    if (xQueueReceive(telemetriaQueue, &datos, portMAX_DELAY) == pdPASS) {
      if (WiFi.status() == WL_CONNECTED) {
        http.begin(serverUrl);
        http.addHeader("Content-Type", "application/json");
        http.addHeader("Connection", "keep-alive"); // Reutiliza socket TCP

        StaticJsonDocument<256> doc;
        doc["id_pulsera"] = datos.id_pulsera;
        doc["bpm"] = datos.bpm;
        doc["spo2"] = datos.spo2;
        doc["temp"] = datos.temp;
        doc["estado_alerta"] = datos.estado_alerta;

        String jsonPayload;
        serializeJson(doc, jsonPayload);

        int code = http.POST(jsonPayload);
        http.end();
      }
    }
  }
}

void setup() {
  Serial.begin(115200);

  // Crear cola con capacidad para 50 estructuras
  telemetriaQueue = xQueueCreate(50, sizeof(struct_telemetria));

  WiFi.mode(WIFI_AP_STA);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
  }

  esp_now_init();
  esp_now_register_recv_cb(onDataRecv);

  // Lanzar consumidor en Core 1 con prioridad 1 y stack de 8KB
  xTaskCreatePinnedToCore(
    httpDispatchTask,
    "HttpDispatcher",
    8192,
    NULL,
    1,
    NULL,
    1
  );

  Serial.println("[GATEWAY CONCURRENTE ACTIVO]");
}

void loop() {
  vTaskDelay(pdMS_TO_TICKS(1000));
}
```

---

## 5. Procedimiento de Puesta en Marcha Paso a Paso

1. **Subir el código al Gateway ESP32:**
   - Abre el monitor serie a `115200 baud`.
   - Copia la línea que imprime en pantalla:
     `DIRECCION MAC DEL GATEWAY (Copiar en las pulseras): XX:XX:XX:XX:XX:XX`.
2. **Subir el código a la Pulsera 1:**
   - Coloca la MAC obtenida en `gatewayMacAddress[]`.
   - Asigna `ID_DISPOSITIVO = "PULSERA_001"`.
   - Flashea el ESP32 de la pulsera.
3. **Subir el código a la Pulsera 2:**
   - Deja la misma MAC del Gateway.
   - Asigna `ID_DISPOSITIVO = "PULSERA_002"`.
   - Flashea el segundo ESP32.
4. **Verificación en el Sistema:**
   - Enciende el Gateway y ambas pulseras.
   - En el monitor serie del Gateway verás inmediatamente los paquetes `[ESP-NOW RX]` de ambas pulseras y la confirmación `[HTTP SERVER OK]` con código `202`.
   - En la interfaz web de **Monitor de Salud / BioTrack** aparecerán las tarjetas de `PULSERA_001` y `PULSERA_002` graficando en vivo ritmo cardíaco, oxígeno y temperatura corporal.
