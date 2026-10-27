# Walkthrough: CRUDs Integrales, Biometría Dual, Portales Web/Mobile, gRPC, GraphQL y WebSockets

## Resumen Ejecutivo
Se completó la implementación y validación técnica del plan de control de acceso integral para **Pisos**, **Dispositivos / Torniquetes**, **Clientes**, **Visitantes** y **Empleados**, incorporando una arquitectura orientada a servicios de alta disponibilidad y tiempo real:

---

## 1. Arquitectura & Patrones de Diseño (Backend Quarkus)
- **Strategy Pattern ([`AccessValidationStrategy.java`](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_server/src/main/java/com/access/control/services/AccessValidationStrategy.java))**:
  - Evaluación desacoplada de reglas de paso:
    - Estado de membresía y solvencia económica (`ACTIVA`, `POR_VENCER` vs `VENCIDA`, `SUSPENDIDA`).
    - Matriz de permisos de piso: Comprueba que el piso del torniquete coincida con los pisos autorizados del cliente o empleado.
- **gRPC & Protobuf ([`acceso.proto`](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_server/src/main/proto/acceso.proto))**:
  - Contrato binario de ultra-baja latencia para validación biométrica, disparo de pulso de relé a torniquetes y reporte de heartbeat de hardware.
- **GraphQL Agregado con SmallRye ([`ControlAccesoGraphQLApi.java`](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_server/src/main/java/com/access/control/graphql/ControlAccesoGraphQLApi.java))**:
  - Queries para vista de detalle sin sobre-carga de red:
    - `clienteDetalleCompleto`: Retorna perfil, último signo vital, membresía y accesos recientes en una sola petición.
    - `empleadoDetalleCompleto`: Retorna ficha de empleado y registros de marcajes in/out.
    - `pisosConDispositivos`: Retorna pisos con su infraestructura de hardware.
- **WebSockets en Tiempo Real**:
  - `/ws/dispositivos` ([`DispositivosWebSocketEndpoint.java`](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_server/src/main/java/com/access/control/component/DispositivosWebSocketEndpoint.java)): Emisión de estado ONLINE/OFFLINE de torniquetes.
  - `/ws/signos-vitales` & `/ws/notificaciones`: Streaming continuo de telemetría de salud y disparo push de emergencias médicas ante BPM > 150 / < 45, SpO2 < 90% o fiebre > 38.3°C en [`SignosVitalesResource.java`](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_server/src/main/java/com/access/control/controller/SignosVitalesResource.java).
- **Auditoría de Accesos ([`AccesoResource.java`](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_server/src/main/java/com/access/control/controller/AccesoResource.java))**:
  - `/api/v1/acceso/historial/permitidos`: Listado de entradas autorizadas.
  - `/api/v1/acceso/historial/denegados`: Bitácora de accesos denegados por falta de pago o zona no permitida con motivo formal.

---

## 2. Portales Web & Mobile y Biometría Dual
- **Clientes (Web & Mobile)**:
  - Enrolamiento biométrico dual: 2 huellas dactilares (`huella1`, `huella2`) + vector facial 128D (`faceVector`).
  - Credencial QR de acceso dinámico: `/api/v1/clientes/{id}/qr`.
  - Historial de pagos y deudas en `/api/v1/finanzas/pagos/cliente/{id}`.
  - Streaming de telemetría IoT desde app móvil: `POST /api/v1/telemetria/signos-vitales`.
- **Empleados**:
  - Credencial QR corporativo: `/api/v1/empleados/{id}/qr`.
  - Asociación de pisos autorizados y registro de jornada.
- **Visitantes**:
  - Generación de pase QR temporal con expiración: `/api/v1/visitas/{id}/qr`.

---

## 3. Frontend Angular 18 (CRUDs Modulares)
- **Normalización de Endpoints**: Todas las llamadas en `shared/*` convertidas a rutas relativas (`/api/v1/...`) para interoperar transparentemente a través del proxy Nginx en contenedor Docker.
- **Nuevos Componentes de Clientes**:
  - [`ClienteListComponent`](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/modulos/cliente/cliente-list/cliente-list.component.ts): Listado con búsqueda en tiempo real, filtros por membresía y badges de biometría.
  - [`ClienteDetailsComponent`](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/modulos/cliente/cliente-details/cliente-details.component.ts): Ficha de detalle, visor de credencial QR dinámico y estado de biometría dual.
  - [`EditarClienteComponent`](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/modulos/cliente/editar-cliente/editar-cliente.component.ts): Modificación de datos personales y renovación de estatus de membresía.
- **Torniquetes y Red**:
  - [`dispositivo-list.component.html`](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/modulos/dispositivo/dispositivo-list/dispositivo-list.component.html): Botón de pulso de apertura manual con confirmación y badge ONLINE en vivo.
- **Pisos y Zonas**:
  - [`piso-list.component.html`](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/modulos/piso/piso-list/piso-list.component.html): Gestión de niveles y zonas con acciones completas de edición y eliminación.
- **Servicios de Streaming y Auditoría**:
  - [`DispositivosStreamService`](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/shared/dispositivo/dispositivos-stream.service.ts) para suscripción reactiva a WebSockets.
  - [`AccesoAuditoriaService`](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/shared/acceso-auditoria.service.ts) para consultas de permitidos e indebidos.

---

## 4. Resultados de Verificación
- **Backend Build & JUnit Tests**:
  - `./mvnw test-compile`: **BUILD SUCCESS** (100 archivos fuente Java compilados).
  - `./mvnw test -Dtest=ModuleBatteriesTest`: **BUILD SUCCESS** (7/7 tests JUnit ejecutados y aprobados con 0 fallos).
  - WebSockets registrados satisfactoriamente en Quarkus: `/ws/notificaciones`, `/ws/dispositivos`, `/ws/signos-vitales`, `/ws/acceso`.
- **Memoria Persistente**: Documentado en [`MEMORIES.md`](file:///Users/samueltovar/Documents/GitHub/control_acceso/MEMORIES.md).
