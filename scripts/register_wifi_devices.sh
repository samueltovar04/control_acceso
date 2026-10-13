#!/usr/bin/env bash

set -e

BACKEND_URL="http://localhost:8080/api/v1"

echo "======================================================================"
echo "    REGISTRO Y ACTUALIZACION DE DISPOSITIVOS - RED WI-FI Y LOCAL     "
echo "======================================================================"

# 1. Volcar tabla ARP del host para resolucion de MAC real en contenedor
arp -an > /tmp/host_arp.txt 2>/dev/null || true

# 2. Obtener lista actual de dispositivos en backend
EXISTING_JSON=$(curl -s "$BACKEND_URL/dispositivos" || echo "[]")

# 2. Definicion de dispositivos base conocidos en la red
IP_LIST=(
  "192.168.1.168"
  "192.168.1.212"
  "192.168.1.214"
  "192.168.1.220"
  "192.168.1.249"
  "192.168.1.140"
  "192.168.1.233"
  "192.168.1.184"
  "192.168.1.106"
  "192.168.0.5"
)

NOMBRES=(
  "Torniquete Principal Entrada"
  "Torniquete VIP Gimnasio"
  "Torniquete Secundario Acceso Salida"
  "Puerta Biometrica Facial P2"
  "Lector Huella/QR Entrada A"
  "Servidor Principal Control Acceso"
  "Terminal Movil Celular"
  "Torniquete Entrada Torniquete B"
  "Dispositivo de Red Control TP-Link"
  "Laptop Master Control"
)

PUERTOS=(
  "3001"
  "3001"
  "3001"
  "8000"
  "4370"
  "8080"
  "3001"
  "3001"
  "80"
  "3001"
)

TIPOS=(
  "Torniquete con Relay TCP"
  "Torniquete con Relay TCP"
  "Torniquete con Relay TCP"
  "Terminal Biometrica Facial"
  "Lector ZKTeco"
  "Servidor de Control"
  "Terminal Movil"
  "Torniquete con Relay TCP"
  "Servidor de Control"
  "Servidor de Control"
)

SOS=(
  "Linux Embedded (ZKOS / HikOS)"
  "Linux Embedded (ZKOS / HikOS)"
  "RTOS"
  "Linux Embedded (ZKOS / HikOS)"
  "Linux Embedded (ZKOS / HikOS)"
  "macOS/Linux 64-bit"
  "Android/iOS"
  "RTOS"
  "Linux Embedded (ZKOS / HikOS)"
  "macOS/Linux 64-bit"
)

# 3. Iterar y registrar o actualizar cada dispositivo
for i in "${!IP_LIST[@]}"; do
  IP="${IP_LIST[$i]}"
  NOMBRE="${NOMBRES[$i]}"
  PUERTO="${PUERTOS[$i]}"
  TIPO="${TIPOS[$i]}"
  SO="${SOS[$i]}"

  # Verificar si ya existe por IP en el backend
  EXISTING_ID=$(echo "$EXISTING_JSON" | grep -o "{\"id\":[0-9]*[^{}]*\"ip\":\"$IP\"" | grep -o "\"id\":[0-9]*" | head -n1 | cut -d: -f2 || true)
  if [ -z "$EXISTING_ID" ]; then
    # Intento de busqueda inversa si la IP aparece en otro orden dentro del JSON
    EXISTING_ID=$(echo "$EXISTING_JSON" | grep -B2 -A10 "\"ip\":\"$IP\"" | grep -o "\"id\":[0-9]*" | head -n1 | cut -d: -f2 || true)
  fi

  PAYLOAD=$(cat <<EOF
{
  "descripcion": "$NOMBRE",
  "nombre": "$NOMBRE",
  "ip": "$IP",
  "port": $PUERTO,
  "entradaSalida": 0,
  "state": 1,
  "piso_id": 1,
  "tipoDispositivo": "$TIPO",
  "tipo": "$TIPO",
  "sistemaOperativo": "$SO",
  "estadoConexion": true
}
EOF
)

  if [ -n "$EXISTING_ID" ]; then
    echo "==> [ACTUALIZANDO] ID $EXISTING_ID | IP: $IP - $NOMBRE..."
    curl -s -X PUT "$BACKEND_URL/dispositivos/$EXISTING_ID" \
      -H "Content-Type: application/json" \
      -d "$PAYLOAD" > /dev/null
    echo "    [OK] Actualizado correctamente con Tipo: '$TIPO' y SO: '$SO'."
  else
    echo "==> [REGISTRANDO NUEVO] IP: $IP - $NOMBRE..."
    curl -s -X POST "$BACKEND_URL/dispositivos" \
      -H "Content-Type: application/json" \
      -d "$PAYLOAD" > /dev/null
    echo "    [OK] Registrado correctamente con Tipo: '$TIPO' y SO: '$SO'."
  fi
done

# 4. Forzar escaneo de ping de todos los dispositivos
echo ""
echo "==> Ejecutando escaneo ping y actualizacion WebSocket..."
curl -s -X POST "$BACKEND_URL/dispositivos/ping-all" > /dev/null || true

echo "======================================================================"
echo "    DISPOSITIVOS REGISTRADOS Y ACTUALIZADOS CORRECTAMENTE            "
echo "======================================================================"
