.PHONY: help build-all docker-build docker-up docker-down up down discover-devices mobile-build test-all clean suprema-build suprema-up suprema-down

help:
	@echo "Control de Acceso - Comandos Disponibles:"
	@echo "  make build-all        - Compila backend Quarkus, frontend Angular y app mobile"
	@echo "  make docker-build     - Construye las imágenes de Docker"
	@echo "  make docker-up        - Inicia los servicios con Docker Compose"
	@echo "  make docker-down      - Detiene los servicios de Docker Compose"
	@echo "  make suprema-build    - Prepara el entorno para el servicio Suprema USB Bridge"
	@echo "  make suprema-up       - Inicia el servicio Suprema USB Bridge en puerto 8085"
	@echo "  make suprema-down     - Detiene el servicio Suprema USB Bridge"
	@echo "  make discover-devices - Detecta IPs de red Wi-Fi local y las registra como torniquetes"
	@echo "  make mobile-build     - Configura e instala la App Mobile apuntando a localhost/IP local"
	@echo "  make test-all         - Ejecuta la suite de pruebas integrales de todos los módulos"

build-all:
	@echo "==> Compilando Backend Quarkus..."
	cd control_server && ./mvnw package -DskipTests
	@echo "==> Compilando Frontend Angular..."
	cd control_web/src/main/web && (npm list @angular/core &>/dev/null || npm install --legacy-peer-deps) && NG_CLI_ANALYTICS=false npx ng build --configuration production
	@echo "==> Compilación completada con éxito."

docker-build:
	@echo "==> Construyendo imágenes Docker..."
	docker compose build

docker-up:
	@echo "==> Iniciando servicios con Docker Compose..."
	docker compose up -d
	@echo "==> Servicios iniciados: PostgreSQL (5432), Quarkus (8080), Angular (80)."

docker-down:
	@echo "==> Deteniendo servicios con Docker Compose..."
	docker compose down -v

up: docker-up suprema-up

down: docker-down suprema-down

suprema-build:
	@echo "==> Verificando dependencias del servicio Suprema USB Bridge..."
	@python3 -m pip install --quiet pyusb || true
	@chmod +x scripts/suprema_usb_bridge.py
	@echo "==> Suprema USB Bridge preparado."

suprema-up: suprema-build
	@echo "==> Iniciando servicio Suprema USB Bridge en background (puerto 8085)..."
	@pkill -f "scripts/suprema_usb_bridge.py" 2>/dev/null || true
	@nohup python3 scripts/suprema_usb_bridge.py > /tmp/suprema_usb_bridge.log 2>&1 &
	@sleep 1
	@echo "==> Suprema USB Bridge en línea en http://127.0.0.1:8085 (PID: $$(pgrep -f 'scripts/suprema_usb_bridge.py'))."

suprema-down:
	@echo "==> Deteniendo servicio Suprema USB Bridge..."
	@pkill -f "scripts/suprema_usb_bridge.py" 2>/dev/null || true
	@echo "==> Suprema USB Bridge detenido."

discover-devices:
	@echo "==> Escaneando IPs activas en red Wi-Fi y registrando dispositivos..."
	@bash scripts/register_wifi_devices.sh

mobile-build:
	@echo "==> Configurando App Mobile apuntando a entorno local (http://192.168.1.140:8080)..."
	cd control_mobile && (npm list axios &>/dev/null || npm install --legacy-peer-deps)
	@echo "==> App Mobile lista en control_mobile."

test-all:
	@echo "==> [1/3] Ejecutando Batería de Pruebas Frontend (Angular)..."
	@node tests/run_frontend_tests.js
	@echo "==> [2/3] Ejecutando Batería de Pruebas Backend & Base de Datos (Quarkus JUnit5)..."
	cd control_server && ./mvnw test -Dtest=ModuleBatteriesTest
	@echo "==> [3/3] Ejecutando Batería de Pruebas E2E / API Endpoints..."
	@bash tests/run_module_tests.sh

clean:
	@echo "==> Limpiando archivos temporales y builds..."
	cd control_server && ./mvnw clean
	rm -rf control_web/src/main/web/dist
