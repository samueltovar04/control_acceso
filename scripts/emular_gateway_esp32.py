#!/usr/bin/env python3
import time
import requests
import random
import sys

URL = "http://localhost:8080/api/v1/telemetria/gateway"

MACS = [
    {"mac": "24:6F:28:AA:BB:CC", "cliente_id": 1, "nombre": "Carlos Mendoza"},
    {"mac": "24:6F:28:11:22:33", "cliente_id": 2, "nombre": "Maria Gomez"},
    {"mac": "24:6F:28:77:88:99", "cliente_id": 3, "nombre": "Juan Perez"}
]

print("Iniciando Gateway Emulador ESP32 (ESP-NOW -> HTTP POST)...")
print(f"Destino: {URL}")

try:
    while True:
        pulsera = random.choice(MACS)
        # Simulacion de variacion fisiologica
        rnd = random.random()
        if rnd < 0.85:
            # Estado normal
            bpm = round(random.uniform(68.0, 84.0), 1)
            spo2 = round(random.uniform(97.0, 99.5), 1)
            temp = round(random.uniform(36.3, 36.9), 2)
            alerta = 0
        elif rnd < 0.93:
            # Taquicardia o esfuerzo
            bpm = round(random.uniform(142.0, 165.0), 1)
            spo2 = round(random.uniform(94.0, 97.0), 1)
            temp = round(random.uniform(37.1, 37.6), 2)
            alerta = 2
        else:
            # Posible desprendimiento / sensor suelto
            bpm = 0.0
            spo2 = 0.0
            temp = round(random.uniform(32.0, 34.0), 2)
            alerta = 1

        payload = {
            "id_pulsera": pulsera["mac"],
            "cliente_id": pulsera["cliente_id"],
            "bpm": bpm,
            "spo2": spo2,
            "temperatura": temp,
            "estado_alerta": alerta
        }

        try:
            res = requests.post(URL, json=payload, timeout=2.0)
            print(f"[TX ESP-NOW->GATEWAY] {pulsera['mac']} ({pulsera['nombre']}) -> BPM:{bpm} SpO2:{spo2}% Temp:{temp}C Estado:{alerta} => HTTP {res.status_code}")
        except Exception as e:
            print(f"[ERROR CONEXION HTTP] {e}")

        time.sleep(1.5)

except KeyboardInterrupt:
    print("\nEmulador detenido por el usuario.")
    sys.exit(0)
