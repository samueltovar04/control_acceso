#!/usr/bin/env python3
import time
import requests
import random
import sys

URL = "http://localhost:8080/api/v1/telemetria/vitales"

PULSERAS = [f"PULSERA_{i:03d}" for i in range(1, 11)]

print(f"Iniciando Emulador ESP32 Gateway para {len(PULSERAS)} pulseras...")
print(f"Endpoint de destino: {URL}")
print("Presiona Ctrl+C para detener.\n")

estado_base = {
    p: {
        "bpm": random.randint(68, 78),
        "spo2": random.randint(97, 99),
        "temp": round(random.uniform(36.3, 36.7), 2)
    }
    for p in PULSERAS
}

try:
    while True:
        # Seleccionar 1 o 2 pulseras por ciclo para simular rafagas asincronas
        seleccionadas = random.sample(PULSERAS, k=random.randint(1, 3))
        
        for pulsera_id in seleccionadas:
            base = estado_base[pulsera_id]
            
            # Dinamica fisiologica gradual
            base["bpm"] += random.choice([-2, -1, 0, 1, 2])
            base["bpm"] = max(50, min(175, base["bpm"]))
            
            base["spo2"] += random.choice([-1, 0, 1])
            base["spo2"] = max(84, min(100, base["spo2"]))
            
            base["temp"] += random.choice([-0.05, 0.0, 0.05])
            base["temp"] = round(max(35.5, min(39.8, base["temp"])), 2)

            # Condicion de alerta (1 = peligro, 0 = normal)
            alerta = 0
            if base["bpm"] > 140 or base["bpm"] < 52 or base["spo2"] < 90 or base["temp"] > 38.3:
                alerta = 1

            payload = {
                "id_pulsera": pulsera_id,
                "bpm": base["bpm"],
                "spo2": base["spo2"],
                "temp": base["temp"],
                "alerta": alerta
            }

            try:
                res = requests.post(URL, json=payload, timeout=2.0)
                status = f"HTTP {res.status_code}"
            except Exception as e:
                status = f"ERR: {e}"

            alerta_str = "ALERTA CRITICA" if alerta == 1 else "NORMAL"
            print(f"[GATEWAY ESP-NOW] {pulsera_id} -> BPM:{payload['bpm']} | SpO2:{payload['spo2']}% | Temp:{payload['temp']}C | {alerta_str} -> {status}")

        time.sleep(1.0)

except KeyboardInterrupt:
    print("\nEmulador de Gateway detenido.")
    sys.exit(0)
