# Plan de Modernización UI/UX, Biometría Dual y Control de Torniquetes en Vivo

## Resumen del Objetivo
Como Product Owner, este plan moderniza la experiencia de usuario y dota al sistema de capacidades biométricas avanzadas de grado empresarial:
1. **Navegación Unificada y Moderna**: Rediseño completo del menú lateral (Sidebar con iconos SVG/PrimeNG, estados activos colapsables, badges de estatus) y barra superior (Topbar con selector de sucursal, estado de torniquetes online/offline, avatar y sesión).
2. **Formularios de Registro Modernos (Clientes y Empleados)**: Componentes reactivos con tabs/pasos:
   - Datos generales y contractuales/membresía.
   - Captura de fotogramas y extracción de embedding facial (128 descriptores normalizados).
   - Captura y digitalización de huellas dactilares (soporte para sensor USB / WebAuthn / emulación de escáner biométrico).
3. **Inicio de Sesión Biométrico**: Modal/Pantalla de Login con tres alternativas: Credenciales tradicionales, Reconocimiento Facial automático por cámara y Lectura Dactilar.
4. **Terminal de Control de Torniquetes en Vivo (Visión + Apertura)**: Componente de monitoreo en el cual la cámara encuadra a la persona entrante, detecta su identidad, valida su membresía/permisos, selecciona automáticamente el torniquete físico o de red local asignado y envía la orden de apertura (`POST /api/v1/acceso/abrir-torniquete/{id}`).

---

## Decisiones de Arquitectura y Patrones

```mermaid
graph TD
    UI[Frontend Angular 18] -->|Capture Video Stream| FaceEngine[Face-API / Embeddings 128D]
    UI -->|Biometric Canvas / WebAuthn| FingerEngine[Fingerprint Capture Engine]
    UI -->|WebSocket /ws/acceso| WSEndpoint[Quarkus Access WebSocket]
    UI -->|REST /api/v1/acceso/validar| Backend[Quarkus Backend Core]
    UI -->|REST /api/v1/dispositivos/{id}/pulso| HardwareGateway[Relay / Turnstile Hardware Gateway]
    Backend -->|Strategy Pattern| AuthStrategy[Biometric vs Credential Strategy]
    Backend -->|JDBC Directo 127.0.0.1:3306/5432| DB[(PostgreSQL / MySQL Local)]
```

- **Patrón Strategy en Autenticación**: Separación de estrategias de login (`PasswordAuthStrategy`, `FaceRecognitionStrategy`, `FingerprintAuthStrategy`).
- **Patrón Observer en Monitoreo de Torniquetes**: Notificación de apertura de paso y flujo de personas vía WebSockets reactivos.
- **Normalización Numérica**: Registro de similitud y porcentajes con redondeo estricto a 2 decimales (`0.98`, `95.50%`).

---

## Cambios Propuestos

### Componente 1: Navegación & Layout (Sidebar & Topbar)

#### [MODIFY] `control_web/src/main/web/src/app/components/left-menu/left-menu.component.html`
- Reemplazar menú legado por un Sidebar responsivo con soporte para:
  - Dashboard General y Financiero.
  - Gestión de Clientes (con estatus de membresías).
  - Gestión de Empleados y Visitantes.
  - Terminal de Torniquetes en Vivo (Cámara + Visión).
  - Dispositivos de Red (Torniquetes Wi-Fi/Ethernet).
  - Monitoreo de Signos Vitales y Alertas de Salud.

#### [MODIFY] `control_web/src/main/web/src/app/components/home/home.component.html`
- Incorporar una barra superior (Topbar / Header) que muestre:
  - Nombre y Logo dinámico de la empresa (Branding).
  - Indicador de estado de conexión WebSocket y torniquetes activos.
  - Perfil del usuario autenticado con botón de Logout.

---

### Componente 2: Captura Biométrica (Huellas Dactilares y Fotogramas Faciales)

#### [NEW] `control_web/src/main/web/src/app/shared/components/biometric-capture/biometric-capture.component.ts`
- Componente reutilizable para formularios de Clientes y Empleados:
  - **Fotogramas Faciales**: Captura continua o por snapshot de la cámara, extracción de vector facial 128D usando `@vladmandic/face-api` o extractor canvas local.
  - **Huella Dactilar**: Interfaz interactiva de captura de huella con visualización de mapa de crestas dactilares, indicador de calidad de captura (0-100%) y generación de template Base64/Hash.

#### [NEW] `control_web/src/main/web/src/app/shared/components/biometric-capture/biometric-capture.component.html`
- Vista dividida (Face Mesh + Fingerprint Scanner visual) con feedback táctil y visual.

#### [MODIFY] `control_web/src/main/web/src/app/modulos/empleado/crear-empleado/crear-empleado.component.html`
#### [MODIFY] `control_web/src/main/web/src/app/modulos/empleado/crear-empleado/crear-empleado.component.ts`
- Modernización del formulario con stepper/tabs, validaciones reactivas e inserción del componente de biometría (huella 1, huella 2 y face vector).

#### [NEW] `control_web/src/main/web/src/app/modulos/cliente/crear-cliente/crear-cliente.component.ts`
#### [NEW] `control_web/src/main/web/src/app/modulos/cliente/crear-cliente/crear-cliente.component.html`
- Formulario de alta de clientes moderno con selección de membresía, asignación de torniquetes permitidos y registro biométrico.

---

### Componente 3: Autenticación Biométrica y Apertura de Torniquetes en Vivo

#### [NEW] `control_web/src/main/web/src/app/features/login/login.component.ts`
#### [NEW] `control_web/src/main/web/src/app/features/login/login.component.html`
- Pantalla de Login moderna con 3 pestañas:
  - Usuario y Contraseña estándar.
  - Identificación Facial (reconocimiento automático al mirar la cámara).
  - Identificación Dactilar (apoyo por lector USB / simulación biométrica).

#### [MODIFY] `control_web/src/main/web/src/app/features/biometria-facial/biometria-facial.component.ts`
#### [MODIFY] `control_web/src/main/web/src/app/features/biometria-facial/biometria-facial.component.html`
- Convertir en **Terminal de Control de Acceso y Torniquetes en Vivo**:
  - Selector de Torniquete Activo (lista desplegable con las IPs de red: `192.168.1.168`, `192.168.1.212`, `192.168.1.220`, etc.).
  - Reconocimiento continuo de fotogramas.
  - Al validar el acceso concedido, disparo automático del pulso de apertura al torniquete seleccionado (`POST /api/v1/acceso/dispositivo/{id}/abrir`).
  - Botón de apertura manual de emergencia por supervisor.
  - Registro sonoro/visual de apertura con log de eventos.

---

### Componente 4: Backend Quarkus & Base de Datos

#### [MODIFY] `control_server/src/main/java/com/access/control/controller/AccesoResource.java`
- Añadir endpoint `POST /api/v1/acceso/dispositivo/{id}/abrir` para simular/enviar el pulso de apertura física del relé del torniquete.
- Añadir endpoint `POST /api/v1/acceso/login-biometrico` que recibe huella o faceVector y genera el token de sesión.

#### [MODIFY] `control_server/src/main/java/com/access/control/controller/BiometriaResource.java`
- Añadir método `POST /api/v1/biometria/verificar-huella` con comparación de template dactilar.

#### [MODIFY] `control_server/src/main/java/com/access/control/controller/ClientesController.java`
- Exponer operaciones completas para CRUD de clientes con persistencia de campos biométricos (`huella1`, `huella2`, `faceVector`).

---

## Plan de Verificación

### Pruebas Automatizadas
1. **Frontend**:
   ```bash
   node tests/run_frontend_tests.js
   ```
   Validación de componentes de captura de huella, login biométrico y terminal de torniquetes.
2. **Backend**:
   ```bash
   cd control_server && ./mvnw test -Dtest=ModuleBatteriesTest
   ```
   Validación de endpoints de apertura de torniquetes y validación dactilar/facial.
3. **Build de Producción**:
   ```bash
   make build-all
   ```

### Verificación Manual
1. Abrir `http://localhost/#/home` y verificar el nuevo Sidebar colapsable y Topbar moderno con estatus de dispositivos.
2. Ingresar a `Crear Empleado` / `Crear Cliente` y probar el componente de captura de huella y fotogramas faciales.
3. Ingresar a `Terminal de Torniquetes en Vivo`, seleccionar uno de los torniquetes Wi-Fi (`192.168.1.168`), permitir la cámara y probar la apertura de paso al conceder acceso.
4. Ingresar al Login y probar el inicio de sesión por reconocimiento facial o huella.
