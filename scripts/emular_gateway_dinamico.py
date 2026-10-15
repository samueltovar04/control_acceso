#!/usr/bin/env python3
import time
import requests
import random
import sys

URL = "http://localhost:8080/api/v1/telemetria/gateway-ingest"

POOL_TOTAL = [f"PULSERA_{i:03d}" for i in range(1, 26)]
# Iniciamos con 4 pulseras activas
pulseras_activas = ["PULSERA_001", "PULSERA_002", "PULSERA_003", "PULSERA_004"]

print("=================================================================")
print("EMULADOR ESP32 GATEWAY - TELEMETRIA DINAMICA IoT")
print(f"Destino: {URL}")
print("Comportamiento: Altas y desconexiones continuas de pulseras")
print("=================================================================\n")

dispositivos_estado = {}

def get_estado(id_p):
    if id_p not in dispositivos_estado:
        dispositivos_estado[id_p] = {
            "bpm": random.randint(68, 76),
            "spo2": random.randint(97, 99),
            "temp": round(random.uniform(36.3, 36.7), 2)
        }
    return dispositivos_estado[id_p]

try:
    ciclo = 0
    while True:
        ciclo += 1

        # Evento aleatorio: Ingreso de nueva pulsera al establecimiento
        if random.random() < 0.25 and len(pulseras_activas) < 16:
            candidatos = [p for p in POOL_TOTAL if p not in pulseras_activas]
            if candidatos:
                nueva = random.choice(candidatos)
                pulseras_activas.append(nueva)
                print(f"\n[+] NUEVA CONEXION: {nueva} ingreso al rango del Gateway (Total activas: {len(pulseras_activas)})")

        # Evento aleatorio: Salida / desconexion de pulsera (excepto PULSERA_001 y PULSERA_002)
        if random.random() < 0.18 and len(pulseras_activas) > 2:
            removibles = [p for p in pulseras_activas if p not in ("PULSERA_001", "PULSERA_002")]
            if removibles:
                desconectada = random.choice(removibles)
                pulseras_activas.remove(desconectada)
                if desconectada in dispositivos_estado:
                    del dispositivos_estado[desconectada]
                print(f"\n[-] DESCONEXION: {desconectada} fuera de rango o apagada (Total activas: {len(pulseras_activas)})")

        # Emitir lecturas: siempre incluir PULSERA_001 o PULSERA_002 + aleatorias
        pulseras_fijas = ["PULSERA_001", "PULSERA_002"]
        seleccionadas = list(set([random.choice(pulseras_fijas)] + random.sample(pulseras_activas, k=min(len(pulseras_activas), 2))))

        for id_p in seleccionadas:
            st = get_estado(id_p)
            st["bpm"] = max(50, min(170, st["bpm"] + random.choice([-2, -1, 0, 1, 2])))
            st["spo2"] = max(85, min(100, st["spo2"] + random.choice([-1, 0, 1])))
            st["temp"] = round(max(35.5, min(39.5, st["temp"] + random.choice([-0.05, 0.0, 0.05]))), 2)

            alerta = 0
            if st["bpm"] > 140 or st["bpm"] < 52 or st["spo2"] < 90 or st["temp"] > 38.3:
                alerta = 1

            payload = {
                "id_pulsera": id_p,
                "bpm": st["bpm"],
                "spo2": st["spo2"],
                "temp": st["temp"],
                "estado_alerta": alerta
            }

            try:
                res = requests.post(URL, json=payload, timeout=2.0)
                status = f"HTTP {res.status_code}"
            except Exception as e:
                status = f"ERR: {e}"

            alerta_str = "ALERTA" if alerta == 1 else "NORMAL"
            print(f"[GATEWAY ESP-NOW] {id_p} -> BPM:{st['bpm']} | SpO2:{st['spo2']}% | Temp:{st['temp']}C | {alerta_str} -> {status}")

        time.sleep(0.9)

except KeyboardInterrupt:
    print("\nEmulador finalizado.")
    sys.exit(0)
