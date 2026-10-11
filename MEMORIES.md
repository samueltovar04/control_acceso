# MEMORIES.md - Persistent Memory Protocol

## Historial de Tareas y Estado del Sistema

### 1. Despliegue Local y Dockerización
- **Docker Compose**: Orquestación de tres servicios (`access_control_db`, `access_control_backend`, `access_control_frontend`).
- **PostgreSQL 15**: Puerto 5432 expuesto con healthcheck.
- **Backend Quarkus 3.x**: Expuesto en puerto 8080.
- **Frontend Angular 17 / Nginx**: Expuesto en puerto 80 con proxy reverso a `/api/v1/`.
- **Makefile**: Metas `build-all`, `docker-build`, `docker-up`, `docker-down`, `discover-devices`, `mobile-build`, `test-all`, `clean`.

### 2. Dispositivos de Red Local Wi-Fi (Torniquetes y Lectores)
- Detección automática vía tabla ARP (`arp -an` en `en0`).
- Mapeo de dispositivos:
  - `192.168.1.168`: Torniquete Principal Entrada
  - `192.168.1.212`: Torniquete VIP Gimnasio
  - `192.168.1.214`: Torniquete Secundario Acceso Salida
  - `192.168.1.220`: Puerta Biometrica Facial P2
  - `192.168.1.249`: Lector Huella/QR Entrada A
  - `192.168.1.140`: Servidor Host Control Acceso
- Script automatizado: `scripts/register_wifi_devices.sh`.

### 3. Compilación e Integración Mobile
- App React Native en `control_mobile/` configurada para apuntar al backend local (`http://localhost:8080/api/v1`).
- Módulos probados: Credencial QR dinámico, Dashboard de Cliente, Historial de Accesos y Alertas Médicas.

### 5. Modernización UI/UX, Biometría Dual y Torniquetes en Vivo
- **Navegación**: Nuevo Sidebar oscuro responsivo con categorización y Topbar con branding, estado de red Wi-Fi y sesión activa.
- **Biometría Dual**: Componente reutilizable `BiometricCaptureComponent` para extracción de fotogramas (vector 128D) y lectura/calidad de huellas dactilares (índice y pulgar), integrado en alta de Clientes y Empleados.
- **Terminal de Visión y Torniquetes**: Selección de dispositivos de red (`192.168.1.168`, `192.168.1.212`, etc.), reconocimiento en vivo con cámara y envío de pulso de apertura (`/api/v1/acceso/dispositivo/{id}/abrir`) con temporizador de 3s y bitácora de paso.
- **Login Multicanal**: Autenticación por credenciales, reconocimiento facial por cámara y huella dactilar.
- **Despliegue Docker**: Contenedores en ejecución en `http://localhost/` y `http://localhost:8080/`.
