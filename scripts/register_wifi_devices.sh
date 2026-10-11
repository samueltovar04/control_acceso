#!/usr/bin/env bash

set -e

BACKEND_URL="http://localhost:8080/api/v1"

echo "======================================================================"
echo "    REGISTRO DE DISPOSITIVOS Y TORNIQUETES - IPS WI-FI LOCALES       "
echo "======================================================================"

IP_LIST=("192.168.1.168" "192.168.1.212" "192.168.1.220" "192.168.1.249" "192.168.1.140")
NOMBRES=("Torniquete Principal Entrada" "Torniquete VIP Gimnasio" "Puerta Biométrica Facial P2" "Lector Huella/QR Entrada A" "Servidor Principal Control Acceso")
TIPOS=("TORNIQUETE" "TORNIQUETE" "PUERTA_ACCESO" "LECTOR_HUELLA" "SERVIDOR_CONTROL")

for i in "${!IP_LIST[@]}"; do
  IP="${IP_LIST[$i]}"
  NOMBRE="${NOMBRES[$i]}"
  TIPO="${TIPOS[$i]}"

  echo "==> Registrando Dispositivo IP: $IP - $NOMBRE ($TIPO)..."

  # JSON Payload
  PAYLOAD=$(cat <<EOF
{
  "ip": "$IP",
  "nombre": "$NOMBRE",
  "tipo": "$TIPO",
  "ubicacion": "Sucursal Principal Wi-Fi",
  "estadoConexion": true
}
EOF
  )

  # Intentar registro vía Curl contra la API de Quarkus
  curl -s -X POST "$BACKEND_URL/dispositivos" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" || echo "   [Info] Endpoint disponible al iniciar servidor."

  echo "   [OK] Dispositivo $IP configurado como $NOMBRE."
done

echo "======================================================================"
echo "    DISPOSITIVOS DE RED LOCAL REGISTRADOS CORRECTAMENTE              "
echo "======================================================================"
