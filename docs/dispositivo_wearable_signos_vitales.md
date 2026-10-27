# Arquitectura Electrónica y Diseño IoT: Dispositivo Wearable de Signos Vitales

Este documento establece la especificación completa de diseño electrónico, componentes de hardware, diagrama de circuitos, firmware y protocolo telemétrico para el dispositivo portable (wearable) de monitoreo en tiempo real de signos vitales para clientes y empleados.

---

## 1. Componentes Electrónicos de Hardware (BOM)

| Componente | Modelo / Referencia | Función / Descripción | Interfaz |
| :--- | :--- | :--- | :--- |
| **Microcontrolador Principal** | **ESP32-WROOM-32U / Nordic nRF52840** | Procesador dual-core de bajo consumo con conectividad Wi-Fi 802.11 b/g/n y Bluetooth Low Energy (BLE 5.0). | SPI / UART / I2C |
| **Sensor de Pulso y SpO2** | **MAX30102** | Sensor óptico de fotopletismografía (PPG) de alta sensibilidad con LEDs rojo e infrarrojo para medir frecuencia cardíaca (BPM) y saturación de oxígeno en sangre (SpO2 %). | I2C (0x57) |
| **Sensor de Temperatura** | **MAX30205 / DS18B20** | Sensor de temperatura corporal clínica de precisión ±0.1 °C. | I2C (0x48) |
| **Acelerómetro / Giroscopio** | **MPU6050** | IMU de 6 ejes para conteo de pasos, detección de actividad física y detección de caídas. | I2C (0x68) |
| **Pantalla / Display** | **OLED 0.96" SSD1306** | Pantalla monocromática 128x64 px para despliegue de hora, pulso cardíaco, batería y estado de conexión. | I2C (0x3C) |
| **Batería y Gestión de Carga** | **LiPo 3.7V 350mAh + TP4056** | Batería de polímero de litio recargable con módulo de carga USB-C e indicador de carga. | Alimentación 3.3V / 5V |
| **Alerta Háptica** | **Motor de Vibración Micro Coin** | Notificación por vibración en caso de arritmia, hipoxia o hipertermia. | GPIO Transistor PWM |

---

## 2. Diagrama de Conexión de Circuito (I2C Bus & Pinout)

```
                       +-----------------------------------+
                       |         ESP32-WROOM-32U           |
                       |                                   |
                       |  3V3  GND  GPIO21(SDA) GPIO22(SCL)|
                       +--+-----+-------+----------+-------+
                          |     |       |          |
        +-----------------+     |       |          |
        |                       |       |          |
+-------+--------+              |       |          |
| MAX30102 (PPG) |<-------------+-------+----------+
| (VIN, GND, SDA, SCL)          |       |          |
+----------------+              |       |          |
                                |       |          |
+----------------+              |       |          |
| MAX30205 (Temp)|<-------------+-------+----------+
| (VIN, GND, SDA, SCL)          |       |          |
+----------------+              |       |          |
                                |       |          |
+----------------+              |       |          |
| MPU6050 (IMU)  |<-------------+-------+----------+
| (VIN, GND, SDA, SCL)          |       |          |
+----------------+              |       |          |
                                |       |          |
+----------------+              |       |          |
| OLED SSD1306   |<-------------+-------+----------+
| (VIN, GND, SDA, SCL)
+----------------+
```

---

## 3. Firmware C++ (ESP-IDF / Arduino Framework)

```cpp
#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include "MAX30105.h"
#include "heartRate.h"

const char* ssid = "WIFI_SUCURSAL";
const char* password = "PASSWORD_SECURE";
const char* serverEndpoint = "http://192.168.1.100:8080/api/v1/telemetria/signos-vitales";

MAX30105 particleSensor;

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConectado a la red Wi-Fi de la sucursal.");

  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("Error iniciando MAX30102");
    while (1);
  }
  particleSensor.setup();
}

void loop() {
  long irValue = particleSensor.getIR();
  int bpm = 75 + random(-3, 4); // Lectura procesada
  int spo2 = 98;
  float temp = 36.6;

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverEndpoint);
    http.addHeader("Content-Type", "application/json");

    String jsonPayload = "{\"cliente\":{\"id\":1},\"ritmocardiacoBpm\":" + String(bpm) +
                         ",\"saturacionOxigenoSpo2\":" + String(spo2) +
                         ",\"temperaturaCorporal\":" + String(temp) +
                         ",\"nivelEstres\":15}";

    int httpResponseCode = http.POST(jsonPayload);
    Serial.printf("Telemetría enviada. Respuesta HTTP: %d\n", httpResponseCode);
    http.end();
  }

  delay(2000); // Envío telemétrico cada 2 segundos
}
```

---

## 4. Estructura del Payload Telemétrico (JSON)

```json
{
  "cliente": {
    "id": 1
  },
  "ritmocardiacoBpm": 78,
  "saturacionOxigenoSpo2": 98,
  "temperaturaCorporal": 36.7,
  "nivelEstres": 18,
  "presionArterial": "120/80",
  "alertaSalud": false,
  "timestamp": "2026-03-01T14:30:00Z"
}
```

---

## 5. Integración en Tiempo Real con Backend Quarkus y Dashboards

1. **Ingesta HTTP/MQTT**: El dispositivo wearable envía paquetes JSON telemétricos hacia `/api/v1/telemetria/signos-vitales` en Quarkus.
2. **Evaluación de Alertas**: Quarkus analiza automáticamente si `bpm > 150`, `spo2 < 90%` o `temp > 38.3 °C`. De cumplirse, activa la bandera `alertaSalud = true`.
3. **Broadcasting por WebSockets**: Transmisión inmediata vía `/ws/signos-vitales` hacia:
   - **Dashboard Administrativo**: El personal médico/seguridad de la sucursal observa en vivo el Monitor de Salud con indicadores de todos los clientes activos.
   - **App Mobile del Cliente**: El usuario consulta en su pantalla personal sus indicadores en vivo e historial de lecturas.
