# MEMORIES.md - Persistent Memory Protocol

## Historial de Tareas y Estado del Sistema

### 1. Despliegue Local y Dockerización
- **Docker Compose**: Orquestación de servicios (`access_control_db`, `access_control_backend`, `access_control_frontend`, `biotrack_mongo`).
- **Modulo Clientes Refactorizado**:
  - Botones de acciones claros y etiquetados en tabla (`Membresia`, `Pulsera`, `QR`, `Editar`, `Eliminar`).
  - Modal de activacion/cambio rapido de membresia (`ACTIVA`, `POR_VENCER`, `VENCIDA`, `SUSPENDIDA`, `SIN_MEMBRESIA`).
  - Modal de asignacion de pulsera IoT (codigo/MAC) enlazada al cliente.
  - Tarjeta de telemetria en vivo identica al diseno solicitado (*Mis Constantes Vitales (Wearable)*) con Ritmo Cardiaco (BPM rojo), Oxigeno SpO2 (azul), Temperatura (amarillo) conectado a `/ws/signos-vitales` y transmitiendo a apps mobile y dashboards.
- **PostgreSQL 15**: Puerto 5432 expuesto con healthcheck.
- **Backend Quarkus 3.x**: Expuesto en puerto 8080.
- **Frontend Angular 17 / Nginx**: Expuesto en puerto 80 con proxy reverso a `/api/v1/`.
- **Makefile**: Metas `build-all`, `docker-build`, `docker-up`, `docker-down`, `discover-devices`, `mobile-build`, `test-all`, `clean`.

### 2. Dispositivos de Red Local Wi-Fi (Torniquetes y Lectores)
- Detección automática vía tabla ARP (`arp -an` en `en0`).
- Mapeo de dispositivos:
  - `192.168.1.168`: Torniquete Principal Entrada- **Biomedical IoT Bracelet & Gateway (ESP32 + Quarkus):**
  - Docker Compose: MongoDB `mongo:6.0` agregado como servicio `biotrack_mongo` con volumen `mongodb_data` y credenciales.
  - Ingesta Reactiva: `POST /api/v1/telemetria/gateway-ingest` y `/api/v1/telemetria/gateway` persistiendo `TelemetriaLectura` exclusivamente en MongoDB y despachando a WebSocket.
  - Persistencia 100% NoSQL (MongoDB): Se desacoplo PostgreSQL de las lecturas y signos vitales; todas las consultas (`/api/v1/telemetria/cliente/{id}`, `/ultimo`, `/alertas`, `/historico`) leen de MongoDB directamente. Cero escrituras en la base de datos relacional.
  - Entidad & Repo: `TelemetriaLectura` y `TelemetriaRepository` con `findUltimas50PorPulsera`, `findUltimoPorPulsera`, `findAlertasActivas`, `findConFiltros` (fecha exacta, pulsera y límite 2000) y `findRecientes` indexado.
  - WebSocket: `/ws/vital-signs` y `/ws/signos-vitales` con broadcast dual para retrocompatibilidad.
  - Monitor de Salud IoT: `monitor-salud.component.ts` con tarjetas únicas dinámicas por pulsera, modal interactivo de Historial de Lecturas Telemétricas en el tag superior, filtrado puntual por día de calendario directo en MongoDB y acumulación sin recortes con tope óptimo de 2000.
  - Hardware Biométrico Suprema USB: Servicio `scripts/suprema_usb_bridge.py` en puerto 8085 enlazado a `Suprema Fingerprint Scanner (Ver.02)` (Vendor: 0x16d1, Product: 0x0406), exponiendo `/api/v1/biometria/suprema/status` y `/capturar` con extracción de minucias estándar ISO/IEC 19794-2.
  - Cámara de Enrolamiento: `biometric-capture.component.html/css` ajustado con `object-fit: cover` centrado sin desvíos y emisión directa al formulario de Clientes.
  - UI Web Standalone en Quarkus: `control_server/src/main/resources/META-INF/resources/dashboard-dinamico.html`.
  - Emulador Python Dinamico: `scripts/emular_gateway_dinamico.py`.
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

### 6. CRUDs Integrales, Arquitectura SOLID, gRPC, GraphQL y WebSockets
- **Contratos Protobuf & gRPC**: Creado `src/main/proto/acceso.proto` con servicios de validacion y pulso de torniquetes inter-servicios.
- **GraphQL (SmallRye)**: `ControlAccesoGraphQLApi.java` exponiendo queries `clienteDetalleCompleto`, `empleadoDetalleCompleto` y `pisosConDispositivos`.
- **WebSockets en Tiempo Real**: 
  - `/ws/dispositivos` para streaming de torniquetes ONLINE/OFFLINE.
  - `/ws/vital-signs` para difusion push de signos vitales (BPM, SpO2, temperatura) y alertas medicas automaticas.
- **Patron Strategy de Validacion**: `AccessValidationStrategy.java` para comprobacion desacoplada de pagos/membresias y permisos por piso/torniquete.
- **Auditoria de Accesos**: Endpoints `/api/v1/acceso/historial/permitidos` y `/historial/denegados` (bloqueos por falta de pago o piso no autorizado).
- **CRUDs Completos Frontend**:
  - Clientes: `cliente-list`, `crear-cliente`, `editar-cliente`, `cliente-details` con visualizador de credencial QR dinámico.
  - Dispositivos: `dispositivo-list` modernizado con boton de apertura remota y estado online.
  - Pisos: `piso-list` modernizado con acciones y vinculacion de hardware.
  - Empleados y Visitantes: Credencial QR, biometria dual y asociacion de pisos.

### 7. Sincronización SQL, Correcciones de Formularios y Selectores Relacionales
- **Esquema SQL (`controlaccesos.sql`)**: 100% de tablas preexistentes conservadas; anexadas al final las definiciones DDL de `clientes`, `clientes_pisos`, `suscripciones_cliente`, `pagos`, `conciliaciones_pago`, `accesos_registro`, `signos_vitales` y `biometria_facial`.
- **Correcciones en Vistas Frontend**:
  - `editar-piso.component.html`: Corregido encabezado que erróneamente indicaba *"Modificar Visitante"* a *"Modificar Piso / Nivel"* con campos adaptados y validación.
  - `empleado-list.component.html`: Incorporado botón superior **"Nuevo Empleado"** (`/home/empleado-add`), contador y estilos consistentes.
  - `visitante-list.component.html`: Incorporado botón superior **"Nuevo Visitante"** (`/home/visitante-add`), tabla moderna y acciones.
- **Selectores Relacionales Dinámicos**:
  - `crear-dispositivo` y `editar-dispositivo`: Selector desplegable de Pisos alimentado por `PisoService.getPisosList()`.
  - `crear-empleado`: Selectores desplegables dinámicos de **Sedes**, **Gerencias** y **Tipos de Contrato** consumiendo sus respectivos servicios REST.
### 8. Modulos de Sedes, Gerencias, Contratos, Permisos de Pisos y Grillas con Paginacion
- **Nuevos Modulos Frontend**:
  - `SedeListComponent`: CRUD completo de Sedes con busqueda reactiva, paginacion y modal de creacion/edicion.
  - `GerenciaListComponent`: CRUD de Departamentos/Gerencias con busqueda, paginacion y modal dinamico.
  - `TipoContratoListComponent`: CRUD de Modalidades contractuales con busqueda y paginacion.
  - `PermisosPisosComponent`: Modulo unificado de gestion y asignacion de pisos permitidos para Empleados, Clientes y Visitantes con pestanas, busqueda rapida, seleccion multiple y persistencia inmediata.
- **Formularios de Edicion Alineados al Diseno Moderno**:
  - `EditarEmpleadoComponent`: Refactorizado a componente moderno con 2 columnas, selects de Sede, Gerencia, Tipo Contrato, y componente biométrico `BiometricCaptureComponent` con soporte de visualizacion de foto existente.
  - `EditarClienteComponent`: Alineado a layout de 2 columnas con campos de membresia, selects y captura biometrica dual.
- **Grillas con Paginacion y Busqueda**:
  - Paginacion por lotes (10, 25, 50) y busqueda en tiempo real incorporada en: Empleados (853 registros), Clientes, Visitantes, Dispositivos/Torniquetes, Pisos, Sedes, Gerencias y Tipos de Contrato.
- **Backend**:
  - Implementado `PermisosController.java` (`/api/v1/permisos`) para consulta y actualizacion transaccional de pisos permitidos en empleados, visitantes y clientes.
  - Actualizados `EmpleadosServiceImpl` y `ClienteResource` para persistir fotos y biometria en altas y actualizaciones.
- **Despliegue Docker**:
  - Contenedores `access_control_backend` y `access_control_frontend` recompilados y operativos al 100%.

### 9. Escaneo de Ping de Red, Switch de Estado y Monitoreo WebSocket en Dispositivos
- **Tabla de Dispositivos Estandarizada**:
  - Columnas requeridas: `ID`, `Descripcion`, `Ip`, `Puerto`, `Piso`, `Ping`, `Estado`, `Actions`.
  - Indicador visual de Ping con circulo incandescente y badge (`verde` / ONLINE cuando responde, `rojo` / OFFLINE cuando no responde).
  - Switch interactivo `form-check-input toggle-switch` para alternar inmediatamente el `Estado` (`state = 1` Habilitado, `state = 0` Deshabilitado) con persistencia en tiempo real via endpoint `/api/v1/dispositivos/{id}/toggle-state`.
  - Boton de actualizacion rapida reutilizable `reloadData()` y boton dedicado de **"Escanear Ping"** (`escanearRedPing()`).
- **Backend Quarkus**:
  - `Dispositivo.java`: Metodo helper `getColor()` ("verde" / "rojo") segun propiedad `ping`.
  - `DispositivoService` / `DispositivoServiceImpl`: Implementado `checkPing(dispositivo)` con timeout de socket e InetAddress, `findAllEnabled()`, `toggleState(id)` y `pingAllDispositivos()`.
  - `DispositivosController`: Endpoints `PUT /api/v1/dispositivos/{id}/toggle-state`, `POST /api/v1/dispositivos/ping-all` y `POST /api/v1/dispositivos/{id}/ping`.
  - `ScheduledUpdatesOnTopic`: Tarea programada en Quarkus (`@Scheduled(every = "20s")`) que ejecuta `pingAllDispositivos()` y emite periodicamente la lista actualizada de dispositivos a traves de WebSocket (`/ws/dispositivos`).
- **Frontend Angular**:
  - `DispositivoListComponent`: Integrado listener WebSocket a `/ws/dispositivos` que refresca dinamicamente el estado de los dispositivos y sus pings sin recargar la pagina.
  - Paginacion, filtros de busqueda reactiva y diseno responsivo alineado a la estetica general.

### 10. Diagnostico Avanzado de Red, Botones Descriptivos y Formulario Estandarizado de Dispositivos
- **Formularios Modernizados (`editar-dispositivo` y `crear-dispositivo`)**:
  - Estructura visual identica a `editar-piso`: Tarjeta limpia con sombra tenue, boton superior de retorno (`Volver a Dispositivos`), encabezado con icono y subtitulo, grilla responsiva de 3 columnas (Nombre, IP, Puerto, Piso Asignado, Sentido de Paso, Estado Operativo) y botones de accion (`Cancelar` y `Guardar Cambios`).
  - Mapeo bidireccional de `piso_id` y `Piso` en backend y frontend.
- **Acciones Descriptivas en Grilla de Dispositivos**:
  - Botones con etiqueta descriptiva e iconos: `Info Red` (cyan), `Abrir` (verde), `Editar` (azul) y `Eliminar` (rojo).
- **Diagnostico de Hardware y Escaneo de Red en Vivo**:
  - Endpoint `GET /api/v1/dispositivos/{id}/escanear` en Quarkus resolviendo latencia RTT (ms), direccion MAC, fabricante OUI (Hikvision, Dahua, ZKTeco, Espressif, Raspberry Pi, Apple, etc.), hostname / DNS inverso, tipo de hardware inferido, sistema operativo / plataforma, version de firmware y puertos TCP abiertos con identificacion de servicios.
  - Modal reactivo en `dispositivo-list.component.html` para visualizacion completa de telemetria de red con funcion de re-escaneo en vivo.

### 11. Registro de Dispositivos Wi-Fi y Campos Estandarizados (Tipo y Sistema Operativo)
- **Campos en Base de Datos y Entidad (`dispositivos`)**:
  - `tipo_dispositivo` (VARCHAR 255): *Torniquete con Relay TCP*, *Terminal Biometrica Facial*, *Lector ZKTeco*, *Terminal Movil*, *Servidor de Control*.
  - `sistema_operativo` (VARCHAR 255): *Linux Embedded (ZKOS / HikOS)*, *Android/iOS*, *macOS/Linux 64-bit*, *RTOS*.
  - Mapeo en entidad Quarkus `Dispositivo.java`, DDL en `controlaccesos.sql`, y migracion en vivo sobre PostgreSQL.
- **Script de Registro y Actualizacion Dinamica (`scripts/register_wifi_devices.sh`)**:
  - Registro de dispositivos detectados en red local y Wi-Fi (192.168.1.168, 192.168.1.212, 192.168.1.214, 192.168.1.220, 192.168.1.249, 192.168.1.140, 192.168.1.233, 192.168.1.184, 192.168.1.106, 192.168.0.5).
  - Verificacion de existencia: actualiza con `PUT` los preexistentes y registra con `POST` los nuevos.
  - Ejecuta automaticamente escaneo ping y difusion WebSocket tras la sincronizacion.
- **Frontend**:
  - Selectores integrados en formularios de creacion y edicion de dispositivos.
  - Badges informativos en la columna de descripcion de la grilla de dispositivos.

### 12. Desacoplamiento Estricto del Modal de Diagnostico a Telemetria de Red en Vivo
- **Problema Corregido**:
  - El modal de escaneo de red utilizaba `d.getDescripcion()` y mapas estaticos con MACs prefijadas para simular el tipo de hardware, sistema operativo y version de firmware, mostrando datos no reales incluso si el host no tenia puertos abiertos o era otro tipo de dispositivo en la red local.
- **Implementacion de Escaneo Puro de Red**:
  - **Eliminacion de Inferencia por Base de Datos**: `DispositivoServiceImpl.java` ahora evalua exclusivamente la respuesta viva del host (ping ICMP, puertos TCP abiertos, banners HTTP/SSH y resolucion ARP). Cero dependencia del nombre guardado en DB.
  - **Resolucion Real de MAC y Fabricante (OUI)**:
    - Montaje de `/tmp:/host_tmp:ro` en `docker-compose.yml` para acceder a la tabla ARP viva del host.
    - Resolucion de OUI segun prefijo IEEE real (ej. `84:e6:57` Sony, `74:cc:40` TP-Link, `06:ce:b3` / `04:bf:d5` / `ae:2f:57` Apple, `90:b6:86` ZKTeco, `00:1a:8c` Hikvision, o MACs privadas aleatorias de Wi-Fi).
    - Eliminadas MACs falsas por hash.
  - **Banners HTTP / SSH en Vivo**: Captura del header `Server` y etiquetas `<title>` (ej. `nginx/1.31.6`) o banner SSH si los puertos 80, 8080, 443 o 22 estan abiertos.
  - **Manejo Estricto de Hosts Offline**: Si el dispositivo no responde en red, se marcan todos los parametros de hardware y firmware como inalcanzables / no detectables, en lugar de poblar valores predeterminados.
  - **Interfaz de Usuario (`dispositivo-list.component.html`)**: Modal con encabezado enfocado en la IP/puerto objetivo (`Diagnostico de Red en Vivo: IP:Puerto`), aviso de telemetria en tiempo real y distincion clara de puertos abiertos vs protegidos por firewall.
  - **Validacion**: Probado y validado en vivo contra `192.168.1.249` (Sony / puertos cerrados), `192.168.1.140` (Servidor macOS / nginx en 80,8080) y `192.168.1.168` (offline).
