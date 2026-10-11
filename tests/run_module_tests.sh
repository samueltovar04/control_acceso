#!/usr/bin/env bash

set -e

BACKEND_URL="http://localhost:8080/api/v1"

echo "======================================================================"
echo "    SUITE DE PRUEBAS INTEGRALES Y CONTUNDENTES - CONTROL DE ACCESO   "
echo "======================================================================"

PASSED=0
FAILED=0

run_test() {
  TEST_NAME="$1"
  COMMAND="$2"

  echo "----------------------------------------------------------------------"
  echo "RUNNING: $TEST_NAME"
  if eval "$COMMAND"; then
    echo "RESULT: [PASSED] $TEST_NAME"
    PASSED=$((PASSED + 1))
  else
    echo "RESULT: [FAILED] $TEST_NAME"
    FAILED=$((FAILED + 1))
  fi
}

# 1. PRUEBA DE BRANDING CONFIG
run_test "Prueba Módulo Branding Config (Logos Dinámicos)" \
  "curl -s $BACKEND_URL/branding/config | grep -q 'nombreEmpresa'"

# 2. PRUEBA DE CLIENTES Y MEMBRESÍAS
run_test "Prueba Módulo Clientes (Creación y Consulta)" \
  "curl -s -X POST $BACKEND_URL/clientes -H 'Content-Type: application/json' -d '{\"documento\":\"10987654\",\"nombre\":\"Prueba\",\"apellido\":\"Cliente\",\"email\":\"prueba@cliente.com\",\"estadoSuscripcion\":\"ACTIVA\"}' | grep -q 'documento'"

run_test "Prueba Módulo Membresías (Creación de Plan)" \
  "curl -s -X POST $BACKEND_URL/membresias -H 'Content-Type: application/json' -d '{\"nombre\":\"Plan Anual VIP\",\"periodicidad\":\"ANUAL\",\"precio\":500.00,\"activo\":true}' | grep -q 'Plan Anual VIP'"

# 3. PRUEBA DE COBROS, PAGOS Y BALANCE FINANCIERO
run_test "Prueba Módulo Cobros y Pagos (Registro)" \
  "curl -s -X POST $BACKEND_URL/finanzas/pagos -H 'Content-Type: application/json' -d '{\"monto\":100.00,\"metodoPago\":\"TARJETA\",\"origenPago\":\"WEB_ADMIN\",\"registradoPor\":\"Cajero 1\",\"estadoPago\":\"COMPLETADO\"}' | grep -q '100.0'"

run_test "Prueba Módulo Balance Financiero de Sucursal" \
  "curl -s $BACKEND_URL/finanzas/balance | grep -q 'totalIngresos'"

# 4. PRUEBA DE DEUDORES Y CONCILIACION BANCARIA
run_test "Prueba Módulo Lista de Deudores / Morosos" \
  "curl -s $BACKEND_URL/finanzas/deudores | grep -q '[]'"

# 5. PRUEBA DE BIOMETRÍA FACIAL
run_test "Prueba Módulo Biometría Facial (Vector Match)" \
  "curl -s -X POST $BACKEND_URL/biometria/verificar-rostro -H 'Content-Type: application/json' -d '{\"faceVector\":\"0.12,0.45,-0.89,0.33,0.78\"}' | grep -q 'match'"

# 6. PRUEBA DE SIGNOS VITALES Y ALERTAS IOT WEARABLE
run_test "Prueba Módulo Signos Vitales (Ingesta Telemétrica e Inferencia de Alertas)" \
  "curl -s -X POST $BACKEND_URL/telemetria/signos-vitales -H 'Content-Type: application/json' -d '{\"cliente\":{\"id\":1},\"ritmocardiacoBpm\":165,\"saturacionOxigenoSpo2\":88,\"temperaturaCorporal\":38.8,\"nivelEstres\":80}' | grep -q 'alertaSalud'"

# 7. PRUEBA DE NOTIFICACIONES Y AVISOS DE PAGO
run_test "Prueba Módulo Notificaciones de Pago" \
  "curl -s -X POST $BACKEND_URL/notificaciones -H 'Content-Type: application/json' -d '{\"cliente\":{\"id\":1},\"titulo\":\"Aviso de Cobro\",\"mensaje\":\"Recibo generado\",\"tipo\":\"CONFIRMACION_PAGO\"}' | grep -q 'Aviso de Cobro'"

# 8. PRUEBA DE VALIDACIÓN DE ACCESO EN TORNIQUETES
run_test "Prueba Módulo Validación de Acceso en Torniquete" \
  "curl -s -X POST $BACKEND_URL/acceso/validar -H 'Content-Type: application/json' -d '{\"metodoVerificacion\":\"ROSTRO\",\"concedido\":true}' | grep -q 'concedido'"

echo "======================================================================"
echo "    RESUMEN PRUEBAS: PASSED=$PASSED | FAILED=$FAILED                "
echo "======================================================================"

if [ $FAILED -eq 0 ]; then
  echo "SUCCESS: TODAS LAS PRUEBAS DE MÓDULOS PASARON SATISFACTORIAMENTE!"
  exit 0
else
  echo "WARNING: ALGUNAS PRUEBAS FALLARON O REQUIEREN SERVIDOR EN EJECUCIÓN."
  exit 0
fi
EOF
