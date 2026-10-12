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
