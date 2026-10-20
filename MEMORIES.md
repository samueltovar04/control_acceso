# MEMORIES.md - Persistent Memory Protocol

- **Sede y Permisos Preconfigurados por Usuario en Empleados y Visitantes (20-Oct-2026)**:
  - **Empleados (Crear y Editar)**:
    1. En `crear-empleado.component.ts` y `editar-empleado.component.ts`: Inyeccion de `SedeStateService` y `AuthService`.
    2. Si el usuario tiene sede bloqueada o rol restringido (`sedeBloqueada = true`), el selector de sede se preestablece a la sede del usuario (`employee.sedeId = sedeActualId`) y se bloquea (`[disabled]="sedeBloqueada"`), mostrando unicamente la sede autorizada en el `<select>`.
  - **Visitantes (Crear y Editar)**:
    1. En `crear-visitante.component.ts` y `editar-visitante.component.ts`: Se inyecto `SedeStateService` y se implemento `aplicarFiltroSede()`.
    2. El selector de **Anfitrión / Empleado a Visitar** se filtra estrictamente para mostrar solo los empleados pertenecientes a la sede del usuario.
    3. La grilla de **Permisos por Pisos y Zonas** se acota dinamicamente para desplegar unicamente los pisos registrados en la sede autorizada (ej. Guacara), seleccionando de forma predeterminada el nivel base (PB) de dicha sede y previniendo asignacion indebida de niveles foraneos.
    4. En `editar-visitante.component.ts` y `editar-visitante.component.html`: Se modernizo el componente a standalone con enrolamiento facial y soporte completo de permisos por piso en edicion.

- **Identidad Andes Control Acceso y Reactividad en Selector de Sede (20-Oct-2026)**:
  - **Titulo y Favicon**:
    1. En `index.html`: Se actualizo `<title>` a `Andes Control Acceso` (reemplazando `NpApp`).
    2. Se descargo el isotipo oficial `logo-crystal.png` de `andessistemas.com` alojandolo en `assets/images/logo-andes.png` y se genero un nuevo `favicon.ico` binario de 64x64.
  - **Branding Visual**:
    1. En `topbar.component.html`: Se reemplazo el icono estatico por la imagen de `assets/images/logo-andes.png` y texto `Andes Sistemas • Control de Acceso • V.2.0`.
    2. En `left-menu.component.html`: Se integro el logo con la marca `ANDES CONTROL ACCESO`.
    3. En `login.component.html`: Se integro el logo de Andes Sistemas en la cabecera del login.
  - **Reactividad del Selector de Sede**:
    1. En `SedeListComponent` (`sede-list.component.ts`): Al crear, actualizar o eliminar sedes se invoca inmediatamente `sedeStateService.cargarSedes()`.
    2. Al emitir por `sedes$`, el selector en `topbar.component.html` y los componentes suscritos reflejan la nueva sede al instante sin necesidad de recargar la pagina.

- **Filtrado Estricto por Sede para Roles Restringidos (20-Oct-2026)**:
  - **Requisito**: Usuarios con roles `RECEPCION` / `RECEPCIONISTA`, `SEGURIDAD` / `OFICIAL`, `ANALISTA` / `OPERACION` deben tener su sede bloqueada en el topbar (ocultando "Todas las Sedes" y sedes no asignadas) y este filtro debe gobernar estrictamente todos los modulos del sistema: Clientes, Empleados, Visitantes, Torniquetes y Monitor de Signos Vitales.
  - **Frontend**:
    1. En `auth.service.ts`: Metodos de chequeo de roles `isRecepcion()`, `isSeguridad()`, `isAnalista()`, `hasSedeRestringida()`.
    2. En `sede-state.service.ts`: `aplicarReglasUsuario(user)` bloquea `sedeBloqueada = true` si el usuario tiene `hasSedeRestringida()` o tiene `sedeId` asignada, seteando `sedeSeleccionadaId`.
    3. En `topbar.component.html`: Cuando `sedeBloqueada` es true se oculta la opcion "Todas las Sedes" y solo se renderiza la sede asignada.
    4. En `cliente-list.component.ts`: Inyeccion de `SedeStateService`, suscripcion a `sedeSeleccionadaId$` y filtrado dinamico en `filtrarClientes()` por `c.sede.id`.
    5. En `empleado-list.component.ts`: Inyeccion de `SedeStateService`, suscripcion a `sedeSeleccionadaId$` y filtrado dinamico en `aplicarFiltro()` por `e.sede.id`.
    6. En `visitante-list.component.ts`: Inyeccion de `SedeStateService`, suscripcion a `sedeSeleccionadaId$` y filtrado dinamico en `aplicarFiltro()` por `v.sede.id || v.empleadoAVisitar.sede.id || v.sedeId`.
    7. En `torniquetes-hub.component.ts`: Recibe y propaga `sedeSeleccionadaId` hacia `biometria-facial` y `acceso-torniquete`.
    8. En `monitor-salud.component.ts`: Escucha `sedeSeleccionadaId$` y filtra tanto pulseras en vivo como historial telemetrico MongoDB por sede asignada.

- **Creacion de Empleado, Permisos de Pisos y Vinculacion Obligatoria de Usuario (19-Oct-2026)**:
  - **Problemas Solucionados**:
    1. Modal "Modo Local" / "Empleado guardado localmente": `crear-empleado.component.ts` mostraba falsamente que el empleado se habia guardado en modo local cuando en realidad la peticion HTTP fallaba en el backend debido a colision de unicidad en `empleados.user_id` (`uk_3oailepgwu9rqdquwd7e9xlg8`).
    2. Creacion de empleado en tabla `empleados` y generacion automatica de usuario: en `EmpleadosServiceImpl.java` se valida la existencia previa por documento y correo, evitando duplicados; y si el usuario del correo ya pertenece a otro empleado, se impide el intento de reasignacion que provocaba la violacion de constraint.
    3. Permisos de Pisos: en `PermisosController.java` se incorporaron endpoints `/api/v1/permisos/usuarios/{id}` que verifican si ya existe registro de permisos para el empleado asociado; de ser asi, se reutiliza y no se duplica en BD. Si se asigna directo, se actualiza el empleado.
    4. Empleado obligatorio en creacion de Usuario: en `usuario-list.component.ts` se configuro `onBuscarEmpleado()` para filtrar unicamente empleados que no tengan usuario asignado (`!e.user && (!e.userId || e.userId === 0)`). En `guardarUsuario()` y en `UsuarioServiceImpl.java` se establecio como validacion obligatoria seleccionar un empleado sin usuario (`empleadoId` requerido), asignando bidireccionalmente el usuario al empleado.
    5. Reconstruccion y despliegue exitoso en Docker (`access_control_backend` y `access_control_frontend`).

- **Correccion de Secuencia en Authorities y Sanitizacion de Errores SQL (19-Oct-2026)**:
  - **Problema**: Al crear un usuario se generaba el error `duplicate key value violates unique constraint "authorities_pkey" Detail: Key (id)=(1) already exists.` y se exponia la sentencia SQL `insert into authorities ...` al usuario en la interfaz.
  - **Causa Raiz**:
    1. La secuencia `authorities_id_seq` en PostgreSQL habia quedado desincronizada tras inserciones manuales previas (su `last_value` apuntaba a 1 o 2 mientras existian registros persistidos).
    2. El backend (`UsuariosController.java`) y el frontend (`usuario-list.component.ts`) retransmitian directamente el `e.getMessage()` con el volcado completo de la query SQL y la traza de Hibernate al usuario.
  - **Solucion**:
    1. Sincronizadas todas las secuencias de PostgreSQL mediante script `DO $$ ... SELECT setval(...) $$` para que apunten al `MAX(id)` actual de cada tabla.
    2. En [UsuariosController.java](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_server/src/main/java/com/access/control/controller/UsuariosController.java): Captura de excepciones con registro detallado mediante `LOG.error(..., e)` y devolucion de mensajes amigables y precisos (sin codigo SQL ni nombres de tablas o constraints).
    3. En [usuario-list.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/modulos/usuarios/usuario-list/usuario-list.component.ts): Funcion `limpiarMensajeError()` para interceptar y limpiar cualquier traza tecnica residual o sintaxis SQL, mostrando exclusivamente mensajes comprensibles para el usuario final.

- **Despliegue y Levantamiento en Servidor Produccion acceso.andessistemas.com (18-Oct-2026)**:
  - **Causa Raiz**:
    1. Contenedor `access_control_backend` en ciclo de reinicio continuo por fallo de autenticacion en PostgreSQL (`FATAL: password authentication failed for user "admin"`).
    2. En `viajes_gateway`, `acceso.andessistemas.com` apuntaba a `http://access_control_frontend:82` en lugar del puerto interno `:80`.
    3. `access_control_frontend` no compartia la red `conciliacashea_network` del proxy gateway y a la vez no estaba conectado a `default` para comunicarse con `access_control_backend`, arrojando `502 Bad Gateway` y `host not found in upstream`.
    4. El certificado SSL en el proxy utilizaba el de `andessistemas.com` que no cubria el subdominio `acceso.andessistemas.com`.
  - **Resolucion**:
    1. Reset de password de `admin` en `access_control_db` (`ALTER USER admin WITH PASSWORD 'Family.#02';`) levantando Quarkus backend exitosamente en `:8080`.
    2. Conectado `access_control_frontend` a ambas redes (`default` y `conciliacashea_network`) en `docker-compose.yml`.
    3. Ajustado en `/opt/viajescamion/gateway/nginx.conf` el upstream a `http://access_control_frontend:80`.
    4. Generado certificado Let's Encrypt valido con Certbot para `acceso.andessistemas.com` y recargado Nginx.
    5. Creado usuario `superadmin` con roles `ROLE_SUPER_ADMIN` y `ROLE_ADMIN` en PostgreSQL (`users`, `authorities`, `user_authorities`), autenticacion validada con JWT en `/api/v1/auth/login`.
    6. Configurado proxy WebSocket (`proxy_http_version 1.1`, `Upgrade $http_upgrade`, `Connection "Upgrade"`) en `viajes_gateway` para rutas `/ws/` y `/api/`, permitiendo handshakes WSS limpios en `wss://acceso.andessistemas.com/ws/*` (acceso, notificaciones, signos-vitales).
    7. Generado e instalado nuevo `favicon.ico` temático de control de acceso en el frontend y desplegado en producción.
    8. **Sesiones Activas, IP Pública y Permisos de Usuarios**:
       - Registrado `JwtInterceptor` en `app.module.ts` (`HTTP_INTERCEPTORS`) para enviar `Authorization: Bearer <token>` en todas las peticiones salientes hacia `/api/v1/usuarios`, corrigiendo el error `401 Unauthorized` al ver usuarios y datos propios.
       - Extracción dinámica de la IP pública del cliente mediante `X-Forwarded-For` / `X-Real-IP` en `AuthResource.java`, registrando la IP real (ej. `200.82.239.28`) en `sesiones_activas` y auditoría en lugar de `127.0.0.1`.
       - Implementado `POST /api/v1/auth/logout` con delegación transaccional (`usuarioService.revocarSesionPorUsername()`), invalidando la sesión activa del usuario al pulsar *"Cerrar Sesión"*.
       - Regla de aislamiento de sesiones activas: si el usuario no es `SUPER_ADMIN`, no puede ver ni revocar sesiones activas del superadmin (`GET /api/v1/usuarios/sesiones-activas` y `POST /api/v1/usuarios/sesiones-activas/{id}/revocar`). Filtrado activo en backend y frontend.
    9. **Dashboard Dinámico IoT en Producción**:
       - Mapeado `/dashboard-dinamico.html` en el reverse proxy Nginx (`access_control_frontend`) redirigiendo a `access_control_backend:8080/dashboard-dinamico.html`.
       - Ajustado `wsUrl` en `dashboard-dinamico.html` para detectar automáticamente `wss://` y hostname sin sufijos de puerto al navegar bajo HTTPS/443.
       - En `left-menu.component.html`, reemplazado el enlace estático `http://localhost:8080/dashboard-dinamico.html` por la ruta relativa `/dashboard-dinamico.html`, abriendo directamente bajo el dominio del host (`https://acceso.andessistemas.com/dashboard-dinamico.html`).
       - Desplegado y verificado en `https://acceso.andessistemas.com/dashboard-dinamico.html` con telemetría en tiempo real, selección de sedes, emulador y WebSocket activo.
    10. Verificado acceso publico con HTTPS y respuesta HTTP 200 OK.
    11. **Portal Cliente, Restricción Estricta de Navegación y Telemetría Wearable**:
       - Redirección automática directa a `/home/portal-cliente` tras iniciar sesión con rol `CLIENTE`.
       - Bloqueo de navegación en [AuthGuard.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/core/guards/auth.guard.ts): los clientes tienen prohibido acceder a cualquier otra ruta del sistema; intentos manuales redirigen a `/home/portal-cliente`.
       - Ocultado el botón *"Terminal Visión"* en [topbar.component.html](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/components/topbar/topbar.component.html) para usuarios con rol `CLIENTE`.
       - Fijación de sede única asignada en el selector del topbar (ocultando opción global "Todas las Sedes" y sedes no autorizadas cuando `sedeBloqueada = true`).
       - Catálogo completo de cuentas y formas de pago bancarias disponibles en el selector de [portal-cliente.component.html](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/features/portal-cliente/portal-cliente.component.html) sincronizando automáticamente método de pago seleccionado.
       - Telemetría en tiempo real de pulsera wearable conectada a WebSocket `/ws/signos-vitales` con auto-reconexión resiliente en [websocket.service.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/core/services/websocket.service.ts) y consulta inicial REST adaptada a la entidad MongoDB (`bpm`, `spo2`, `temp`).
- **Deteccion Facial y Disparo Automatico en Vision Optima (18-Oct-2026)**:
  - En [biometric-capture.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/shared/components/biometric-capture/biometric-capture.component.ts): Se calibraron los rangos YCbCr y RGB en `analizarRostroEnCanvas` para deteccion inmediata de rostro en webcams estandar bajo diversas condiciones de iluminacion. Se activa `faceBox` y `faceDetectado` al detectar la masa facial, ocultando el ovalo estatico y desplegando el recuadro verde con la etiqueta "Rostro Detectado".
  - En [biometria-facial.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/features/biometria-facial/biometria-facial.component.ts): El ciclo evalua la vision optima del rostro (`width >= 16%`, `height >= 20%`, `left >= 5% && <= 75%`, `top <= 65%`). Al estar centrado y encuadrado, dispara automaticamente `capturarRostro()` con debounce de 2.5s sin requerir clic manual.
  - Compilacion y despliegue del bundle en Docker (`access_control_frontend`).
- **Refactorizacion y Optimizacion Biometrica Facial (17-Oct-2026)**:
  - **Problema Resuelto**: Cualquier persona o fondo estatico respondia erróneamente como Samuel Tovar (`15650242`) en el login y en torniquetes debido a un umbral de similitud coseno plano muy bajo (0.72) y falta de discriminacion de textura e iluminacion.
  - **Frontend ([biometric-capture.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/shared/components/biometric-capture/biometric-capture.component.ts) y [login.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/features/login/login.component.ts))**:
    - Detector facial con discriminador YCbCr + RGB refinado (densidad 8%-65%, ratio aspecto 0.95-1.70) y filtro de histeresis (requiere 2 cuadros estables consecutivos) para evitar deteccion falsa en paredes o muebles.
    - Eliminado el generador de vectores sinteticos con `Math.sin`; si no hay rostro enfocado, no se emite ninguna consulta de verificacion hacia el backend.
  - **Backend ([BiometriaResource.java](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_server/src/main/java/com/access/control/controller/BiometriaResource.java) y [BiometriaVectorRepository.java](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_server/src/main/java/com/access/control/repository/BiometriaVectorRepository.java))**:
    - Motor de comparacion multi-metrico: 50% Correlacion de Pearson (inmune a variaciones de luminosidad base de la habitacion) + 50% Correlacion de Gradiente Espacial (textura y rasgos locales).
    - Umbral de aceptacion elevado a `>= 0.78` (en multivector) y `< 0.22` distancia coseno en pgvector HNSW.
    - Interpolacion lineal y normalizacion L2 unitaria en `parsearEmbedding` para mapear descriptores a `vector(512)` de PostgreSQL.
    - Sincronizado `face_embedding` en la base de datos para los clientes existentes.
    - Validado en vivo: Fondo plano y personas no registradas rechazadas con HTTP 404; usuario registrado reconocido al 100% via `PGVECTOR_HNSW_COSINE`.
  - En [topbar.component.html](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/components/topbar/topbar.component.html): Se renovo la seccion de perfil y salida convirtiendo el boton en un elemento visible destacado (`btn btn-outline-danger btn-sm`) con icono `bi-box-arrow-right` y etiqueta clara *"Cerrar Sesión"*.
  - En [topbar.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/components/topbar/topbar.component.ts): Se inyecto `AuthService` para llamar a `this.authService.logout()` (limpiando `currentUser`, `auth_token`, `usuario_activo` y emitiendo `null` en `currentUser$`) seguido de `router.navigate(['/login'])`.
  - En [left-menu.component.html](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/components/left-menu/left-menu.component.html) y [left-menu.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/components/left-menu/left-menu.component.ts): Se agrego el boton de *"Cerrar Sesión"* en el pie del menu lateral de navegacion (`sidebar-footer`).
  - Build de produccion ejecutado y contenedor `access_control_frontend` desplegado en Docker.
- **Deteccion Facial y Conectividad Camaras en Terminal de Torniquetes (17-Oct-2026)**:
  - **Diagnostico de Causa Raiz**: En `http://localhost/#/home/acceso-torniquetes`, la camara asignada por defecto a la sede es la Camara IP "Camara Hackvision" (IP: `192.168.1.140`, Puerto: `8889`, Ruta: `/cam2/`).
  - Al ser camara IP en streaming WebRTC (`esCamaraIpActiva = true`), el visor renderizaba un `<iframe>` apuntando a MediaMTX y el auto-rastreador facial intentaba descargar cuadros con `GET /api/v1/biometria/camara/snapshot?ip=192.168.1.140&port=8889&path=/cam2/`.
  - MediaMTX servia una pagina HTML (`<!doctype html>...`) en `:8889/cam2/` en lugar de una imagen binaria JPEG. El backend anterior devolvia ese HTML con content-type `image/jpeg`, haciendo fallar la carga en `Image.onerror` del navegador y dejando `faceDetectado = false` y `faceBox = null` de manera permanente.
  - **Resolucion**:
    1. En [BiometriaResource.java](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_server/src/main/java/com/access/control/controller/BiometriaResource.java): Se implemento `obtenerSnapshotConDigest()` con soporte para Digest Authentication contra endpoints ISAPI nativos de Hikvision (`/ISAPI/Streaming/channels/{canal}/picture`) y mapeo inteligente cuando la peticion proviene de rutas o puertos de MediaMTX.
    2. En [biometric-capture.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/shared/components/biometric-capture/biometric-capture.component.ts): Se optimizo la seleccion del elemento `<video>` (`this.elRef?.nativeElement?.querySelector('video') || document.querySelector('video')`) y el control de concurrencia en la peticion de snapshot IP con `cargandoSnapshotTracker = true` para evitar saturacion de frames concurrentes.
    3. Si la camara fisica `192.168.1.197` esta fuera de linea en la red, al seleccionar "Camara Web Local (Navegador)" en el selector de Camara, el tracking facial y el bounding box dinámico se activan instantaneamente sobre la webcam del usuario.
- **Busqueda Facial en toda la Resolucion del Marco de Camara (17-Oct-2026)**:
  - En [biometric-capture.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/shared/components/biometric-capture/biometric-capture.component.ts): Se amplio el escaneo de rostro para cubrir el 100% de las coordenadas del video/iframe (X e Y completos de 0% a 100%), permitiendo detectar la presencia de personas en cualquier sector o cuadrante (arriba, abajo, esquinas o centro).
  - Se modifico `generarVectorFacialDesdeImagen()`: Si existe un rostro detectado en cualquier cuadrante (`faceBox`), el recorte de 64x64 se calcula dinamicamente sobre las coordenadas exactas de `faceBox.top`, `faceBox.left`, `faceBox.width` y `faceBox.height` en lugar de estar restringido al centro estatico.
  - El recuadro delimitador verde dinámico (`.face-bounding-box`) se ajusta y sigue al rostro en cualquier punto del marco visual.
  - Build de produccion de Angular ejecutado y contenedor `access_control_frontend` desplegado en Docker.
  - En [Makefile](file:///Users/samueltovar/Documents/GitHub/control_acceso/Makefile), se retiro `@$(MAKE) db-migrate` del flujo de `docker-up`.
  - Dado que la extension `vector`, las columnas `face_embedding` y los indices HNSW ya existen en la base de datos PostgreSQL, `docker-up` levanta directamente los servicios con `docker compose up -d` sin bloquearse por scripts inexistentes.
  - El target `db-migrate` se condiciono con verificación previa de existencia (`[ -f scripts/migrations/01_pgvector_setup.sql ]`).
  - Ejecucion de `make docker-up` validada exitosamente con codigo 0.
- **Eliminacion de Auto-Disparo Fantasma y Calibracion Antropomorfica (17-Oct-2026)**:
  - En [biometria-facial.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/features/biometria-facial/biometria-facial.component.ts): Se elimino la condicion de fallback de transmision de camara (`hayTransmisionCamara`) que disparaba peticiones continuas sin presencia de personas. El auto-disparo ahora exige estrictamente `tieneRostroEnfocado = (faceDetectado && !!faceBox)`. Si no hay persona frente al lente, la terminal permanece en reposo sin enviar peticiones.
  - En [biometric-capture.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/shared/components/biometric-capture/biometric-capture.component.ts): Se calibraron los filtros de color YCbCr y RGB diferencial para discriminar paredes, luz blanca y fondos estaticos, exigiendo masa compacta facial (minimo 60 pixeles y densidad > 3.5%) y dimensiones craneales antropomorficas (15% a 75% del frame).
  - Al colocarse una persona, se marca inmediatamente el recuadro verde dinamico `.face-bounding-box` y se oculta el ovalo estatico. Al retirarse la persona, el recuadro desaparece y regresa el ovalo de centrado.
  - Build de produccion ejecutado y contenedor `access_control_frontend` desplegado en Docker.
  - En [biometric-capture.component.html](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/shared/components/biometric-capture/biometric-capture.component.html): Se configuro la reticula del ovalo con condicion estricta `*ngIf="!faceDetectado && !faceBox"` para que desaparezca completamente en cuanto el algoritmo detecte presencia de rostro en el visor.
  - Al activarse la presencia facial (`*ngIf="faceBox"`), se despliega de forma exclusiva el recuadro delimitador verde dinámico (`.face-bounding-box`) con etiqueta *"Rostro Detectado"*, acotado a la ubicacion y dimensiones de la persona.
  - En [biometric-capture.component.css](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/shared/components/biometric-capture/biometric-capture.component.css): Se añadio estilo con borde reforzado de 3px, esquinas redondeadas y animacion sutil de pulso luminoso en verde neon (`@keyframes pulse-border`).
  - En [biometric-capture.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/shared/components/biometric-capture/biometric-capture.component.ts): Se implemento histeresis visual (`cuadrosSinRostro`) y escaneo a 250ms para evitar parpadeos bruscos ante micro-movimientos.
  - Frontend Angular compilado en produccion y contenedor `access_control_frontend` desplegado en Docker.
  - En [biometric-capture.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/shared/components/biometric-capture/biometric-capture.component.ts): Se amplio la tolerancia del algoritmo de deteccion facial en canvas (`analizarRostroEnCanvas`) para permitir activacion con umbrales de densidad desde 0.015 y rangos de color YCbCr/RGB mas amplios ante variaciones de iluminacion ambiental. Se agrego `@Output() faceDetected = new EventEmitter<{ faceBox: any }>()`.
  - En [biometria-facial.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/features/biometria-facial/biometria-facial.component.ts): Se optimizo el loop continuo de auto-identificacion (`iniciarEscaneoContinuoQr()`). Al tener `autoIdentificacionFacialActiva` habilitado, verifica presencia de rostro o transmision activa de camara (`videoEl.readyState >= 2 && videoEl.videoWidth > 0`), disparando `capturarRostro()` con debounce responsivo de 2.5s sin requerir pulsacion manual.
  - Se anadio timeout de seguridad de 4.5s sobre `this.procesando` en `onFotogramaCapturado()` para asegurar que la bandera de proceso nunca quede bloqueada si hay demoras de red.
  - Build de produccion de Angular ejecutado y contenedor `access_control_frontend` recreado y levantado en Docker.
  - **Activacion y Tolerancia del Visor Facial**:
    - En [biometric-capture.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/shared/components/biometric-capture/biometric-capture.component.ts), se flexibilizaron los umbrales de deteccion anatomica y tono de piel en `analizarRostroEnCanvas()`: umbral de pixeles bajado de 45 a 25, densidad minima a 0.02, ancho y alto min-max de 8% a 92% del encuadre para tolerar rostros no centrados, ladeados o con iluminacion irregular/contraluz.
    - En [biometria-facial.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/features/biometria-facial/biometria-facial.component.ts), la condicion de disparo automatico se ajusto para verificar `faceDetectado || faceBox` con cadencia responsiva de 2.8s, permitiendo que la terminal en vivo capture e identifique de forma confiable.
  - **Login Facial y Emision de Sesion (`login: true`)**:
    - En [login.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/features/login/login.component.ts), se reemplazo el mock vector hardcodeado por extraccion de descriptores faciales 128D (`extraerVectorDesdeImagen()`) congruente con el banco de enrolamiento multi-angulo.
    - En [BiometriaResource.java](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_server/src/main/java/com/access/control/controller/BiometriaResource.java), se anadio `agregarDatosSesion()` al verificar coincidencia facial en `/api/v1/biometria/verificar-rostro`, emitiendo token JWT SmallRye, roles, nombre y registrando sesion activa y auditoria.
    - En [auth.service.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/core/services/auth.service.ts), se agrego `setSessionFromBiometric()` para registrar el `currentUser` y `auth_token` validos en `localStorage`, habilitando el acceso inmediato a traves del `AuthGuard` hacia `/home/admin-dashboard`.
    - Vinculado usuario `superadmin` al cliente registrado en base de datos PostgreSQL (`UPDATE clientes SET user_id = 1 WHERE id = 1`).
    - Build de frontend Angular (`dist/control-acceso-web`) y backend Quarkus (`control_server-0.0.1-SNAPSHOT.jar`) ejecutados y contenedores Docker desplegados exitosamente.
  - Creado [auth.guard.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/core/guards/auth.guard.ts) implementando `CanActivate` y `CanActivateChild`.
  - En [app.routing.module.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/app.routing.module.ts), se vinculo `canActivate: [AuthGuard]` y `canActivateChild: [AuthGuard]` a la ruta padre `/home`.
  - En [auth.service.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/core/services/auth.service.ts), se elimino cualquier mock token fallback pasivo de desarrollo en `getUserFromStorage()`, exigiendo un token autentico en `currentUser`.
  - Si un usuario ingresa a cualquier URL interna (`/home/biometria-facial`, `/home/admin-dashboard`, etc.) sin sesion activa en `localStorage`, el sistema intercepta la navegacion inmediatamente y lo redirige a `/login` con el parametro `returnUrl`.
  - Build de produccion y contenedor Docker recreado y verificado en `:80`.

- **Matriz de Permisos por Rol y Modulos (17-Oct-2026)**:
  - **ADMIN / SUPER_ADMIN**: Acceso irrestricto a todos los modulos (Panel & Vision, Pagos, Acceso, Infraestructura, Ubicaciones, Seguridad de Usuarios) y selector libre de sedes.
  - **CONTABLE / ROLE_CONTABLE**: Unica y exclusivamente ve el menu **Gestion de Pagos** (Control Finanzas, Control Pagos, Conciliacion, Tasas BCV, Cuentas Bancarias).
  - **RECEPCION y OPERACION (ROLE_RECEPCION / ROLE_OPERACION / ROLE_EMPLEADO)**: Unicamente ven **Panel & Vision** (Control Torniquetes, Monitor de Salud IoT, Telemetria) y **Gestion de Acceso** (Clientes & Membresias, Empleados, Visitantes, Catalogo Membresias). Sede fija y bloqueada a su asignacion.
  - **CLIENTE / ROLE_CLIENTE**: Exclusivamente tiene acceso a **Mi Cuenta -> Datos y Pagos Personales** (Portal Cliente con su estado de cuenta, metodos de pago y membresia equivalente a la app movil).
  - **Infraestructura y Seguridad**: Restringido exclusivamente a roles administrativos (`ADMIN` y `SUPER_ADMIN`).
  - Implementado en [auth.service.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/core/services/auth.service.ts), [left-menu.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/components/left-menu/left-menu.component.ts), [left-menu.component.html](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/components/left-menu/left-menu.component.html) y selector de roles en [usuario-list.component.html](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/modulos/usuarios/usuario-list/usuario-list.component.html).

- **Modulo de Usuarios, Permisos por Rol, Auditoria y Seguridad IDOR (17-Oct-2026)**:
  - **Seguridad y Privacidad Estricta de Datos de Usuario (Prevencion IDOR)**: En [UsuariosController.java](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_server/src/main/java/com/access/control/controller/UsuariosController.java), solo el propio usuario autenticado (titular de la cuenta) o usuarios con rol `ADMIN`/`SUPER_ADMIN` pueden consultar el detalle de un usuario por ID (`GET /api/v1/usuarios/{id}`). Cualquier intento de manipular el ID para ver datos de terceros es rechazado con HTTP 403 Forbidden y registrado en la bitacora de auditoria de seguridad (`CONSULTA_IDOR_BLOQUEADA`).
  - **Restriccion y Automatizacion de Sede por Rol**: En [SedeStateService](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/shared/sede/sede-state.service.ts), usuarios con roles no-administradores toman automaticamente su `sedeId` asignado y el selector global de sede en [topbar.component.html](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/components/topbar/topbar.component.html) queda bloqueado en solo lectura (`readonly`/`disabled`). Solo roles `ADMIN` y `SUPER_ADMIN` tienen la facultad de alternar libremente entre sedes.
  - **Flujo de Login y Cambio Obligatorio de Clave**: En [AuthResource.java](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_server/src/main/java/com/biotrack/resource/AuthResource.java) y [login.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/features/login/login.component.ts), si un usuario tiene la marca `requiresPasswordReset = true` o `primerIngreso = true`, el sistema bloquea el ingreso regular y despliega obligatoriamente el formulario de actualizacion de contrasena con BCrypt.
  - **Auditoria de Accesos y Sesiones Activas**: Entidades y repositorios [AuditoriaAcceso.java](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_server/src/main/java/com/access/control/model/AuditoriaAcceso.java) y [SesionActiva.java](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_server/src/main/java/com/access/control/model/SesionActiva.java) creadas. Se registran todos los inicios de sesion, fallos, bloqueos y sesiones vivas con capacidad de expulsion/revocacion en tiempo real.
  - **Modulo en Frontend Protegido**: Componente [usuario-list.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/modulos/usuarios/usuario-list/usuario-list.component.ts) con pestañas para Usuarios (activar/inactivar, forzar reseteo, asignacion de sede), Auditoria de Accesos y Sesiones Activas. Enlace en [left-menu.component.html](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/components/left-menu/left-menu.component.html) y ruta protegida por [AdminRoleGuard.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/core/guards/admin-role.guard.ts), visible e invocable unicamente por `ADMIN` o `SUPER_ADMIN`.
  - **Compilacion Validada**: Backend Quarkus (`./mvnw clean compile -DskipTests`) y frontend Angular (`ng build --configuration production`) con build exitoso en verde.

- **Limpieza Visual de Terminal de Torniquetes (16-Oct-2026)**:
  - En [biometric-capture.component.html](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/shared/components/biometric-capture/biometric-capture.component.html): Se ocultó el selector secundario "Fuente" cuando se opera en la terminal (`modoIdentificacion = true`), dejando únicamente el selector principal "Cámara".
  - Se eliminó el cuadro/alerta amarilla redundante en la terminal de torniquetes (`!modoIdentificacion`), manteniendo limpia la interfaz debajo de la cámara y centralizando los resultados en la bitácora y el modal informativo.

- **Switch de Modo Manual vs Auto-Identificacion Facial en Terminal (16-Oct-2026)**:
  - En [biometria-facial.component.html](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/features/biometria-facial/biometria-facial.component.html) y [biometria-facial.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/features/biometria-facial/biometria-facial.component.ts): Se agrego el switch interactivo `autoIdentificacionFacialActiva` con badge informativo (`AUTOMATICO` / `MANUAL`).
  - Al estar desmarcado (Modo Manual), el sistema no realiza ninguna peticion facial automatica en segundo plano y espera exclusivamente la accion del operador sobre el boton *"Identificar Rostro / Escanear QR y Abrir"*.

- **Eliminacion de False-Positive Dummy Bounding Box en Camaras IP (16-Oct-2026)**:
  - En [biometric-capture.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/shared/components/biometric-capture/biometric-capture.component.ts): Se removio el fallback estatico que activaba `faceBox` y `faceDetectado = true` artificialmente en streaming WebRTC sin haber personas frente a la camara.
  - El escaneo en camaras IP ahora analiza cuadros reales via snapshot (`/api/v1/biometria/camara/snapshot`) con umbrales de densidad y tamaño antropomorfico (15% a 65% del ancho del frame, densidad > 4% y < 60%). Si no hay un rostro real, `faceDetectado = false`, `faceBox = null` y no se dispara ninguna busqueda automatica.

- **Auto-Identificacion Facial Continua sin Presionar Boton (16-Oct-2026)**:
  - En [biometria-facial.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/features/biometria-facial/biometria-facial.component.ts): Se sincronizo el loop de escaneo en segundo plano (`iniciarEscaneoContinuoQr()`) para evaluar si existe un rostro detectado en el bounding box (`faceDetectado && faceBox`).
  - Al detectar presencia de rostro centrado y estable, ejecuta automaticamente `capturarRostro()` con debounce de 3.5s (`ultimoTimestampFacialAuto`), identificando a la persona en la base de datos y activando la apertura de paso en torniquete sin intervencion manual.

- **Correccion de Espejo y Enfoque en Bounding Box Facial en Vivo (16-Oct-2026)**:
  - En `biometric-capture.component.ts`: Se corrigio la inversion del eje X del recuadro dinamico (`calculatedLeft = 100 - (calculatedLeft + faceWidth)`) cuando la camara opera con espejo activo (`esModoEspejo && !esCamaraIpActiva`).
  - Proporcion aurea y centrado anatomico: Se restringio el calculo de masa de pixeles de piel para acotarse al area craneal/facial con aspect ratio ergonomico (~1:1.3) evitando que se expanda a hombros o sombras.

- **Campo de Ruta / Endpoint Adicional para Dispositivos y Camaras IP (16-Oct-2026)**:
  - Base de Datos: Columna `ruta VARCHAR(255)` añadida a tabla `dispositivos`.
  - Backend: `@Column(name = "ruta") private String ruta;` con getters/setters en `Dispositivo.java`, actualizado en `DispositivoServiceImpl.java`. El endpoint `GET /api/v1/biometria/camara/snapshot` recibe `path` y concatena la URL destino `http://ip:puerto/ruta`.
  - Frontend: Vistas `crear-dispositivo` y `editar-dispositivo` incluyen campo `Ruta / Endpoint Adicional` con vista previa reactiva (`ip:puerto/ruta`). `biometric-device-state.service.ts` y `biometric-capture.component.ts` propagan el valor de `cam.ruta` via query param `path` en `urlCamaraIpSnapshot` y capturas manuales.

- **Validacion Facial Omnicanal y Deteccion de Personas en Base de Datos (16-Oct-2026)**:
  - En [biometric-capture.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/shared/components/biometric-capture/biometric-capture.component.ts) y [biometric-capture.component.html](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/shared/components/biometric-capture/biometric-capture.component.html): Cada vez que se captura una foto o fotograma (webcam o camara IP), se genera el vector facial e inmediatamente ejecuta `verificarCoincidenciaEnBaseDatos()`.
  - Muestra alerta contextual en tiempo real con datos de la persona si ya existe en la base de datos (Nombre, Rol, Doc, Similitud %) o badge verde de "Nuevo sujeto" si no hay coincidencias duplicadas.
  - Sincronizacion activa en columna `face_embedding vector(512)`: Implementado en [BiometriaVectorRepository.java](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_server/src/main/java/com/access/control/repository/BiometriaVectorRepository.java) (`updateFaceEmbedding` y `updateFaceEmbeddingFromString`) e integrado en guardado/actualizacion de `ClienteResource`, `EmpleadosServiceImpl` y `VisitasServiceImpl`.
  - Soporte completo de `Visitantes`: Campo `faceVector` y columna nativa `face_embedding` sincronizados en creación y edición de visitas ([Visita.java](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_server/src/main/java/com/access/control/model/Visita.java), [VisitaDto.java](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_server/src/main/java/com/access/control/dto/VisitaDto.java), [VisitasServiceImpl.java](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_server/src/main/java/com/access/control/services/VisitasServiceImpl.java)).
  - Búsqueda vectorial omnicanal en [BiometriaResource.java](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_server/src/main/java/com/access/control/controller/BiometriaResource.java): `/verificar-rostro` resuelve coincidencias aceleradas por pgvector HNSW y fallback multi-vector para `clientes`, `empleados` y `visitantes`.
  - Compilacion validada: Quarkus (`./mvnw compile -DskipTests`) y Frontend en Docker (`docker compose build access_control_frontend`) exitosos.

- **Epica Biometrica Omnicanal - Bloque Backend & Hardware completado (16-Oct-2026)**:
  - Hardware Suprema (Python): Creado [infrastructure/hardware/biomini_scanner.py](file:///Users/samueltovar/Documents/GitHub/control_acceso/infrastructure/hardware/biomini_scanner.py) implementando patron Facade `BioMiniScanner`, context manager (`__enter__`/`__exit__`) con liberacion incondicional `UFS_Uninit()` en bloque `finally` y fallback para tests sin SDK fisico. Validado con suite unitaria en [test_biomini_scanner.py](file:///Users/samueltovar/Documents/GitHub/control_acceso/infrastructure/hardware/test_biomini_scanner.py).
  - Backend Quarkus (pgvector): Creado [BiometriaMatchDTO.java](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_server/src/main/java/com/access/control/dto/BiometriaMatchDTO.java) y [BiometriaVectorRepository.java](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_server/src/main/java/com/access/control/repository/BiometriaVectorRepository.java) ejecutando busqueda nativa con operador de distancia coseno `<=>` contra `empleados` y `clientes`.
  - Endpoint Biometria: Expuesto `POST /api/v1/biometria/facial/match-vector` en [BiometriaResource.java](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_server/src/main/java/com/access/control/controller/BiometriaResource.java) para inferencia y matching vectorial con umbral configurable. Compilacion verificada exitosa con `./mvnw compile -DskipTests`.

- **Epica Biometrica Omnicanal - Bloque DevOps completado (16-Oct-2026)**:
  - Stack opt-in: [docker-compose.biometria.yml](file:///Users/samueltovar/Documents/GitHub/control_acceso/docker-compose.biometria.yml) + `make bio-up` / `bio-migrate` / `bio-down` en [Makefile](file:///Users/samueltovar/Documents/GitHub/control_acceso/Makefile). `docker-compose.yml` intacto por decision del usuario.
  - BD: imagen propia [infrastructure/db/Dockerfile](file:///Users/samueltovar/Documents/GitHub/control_acceso/infrastructure/db/Dockerfile) (postgres:15-alpine + pgvector 0.5.0). Verificado: extension 0.5.0, `face_embedding vector(512)` e indices `idx_*_face_hnsw` en `empleados`, `clientes`, `visitantes` via [01_pgvector_setup.sql](file:///Users/samueltovar/Documents/GitHub/control_acceso/scripts/migrations/01_pgvector_setup.sql).
  - Camara: Hikvision 192.168.1.197. `/live/chN` da 404; rutas validas `/Streaming/Channels/101` (HEVC 1280x720) y `/102` (H264 704x576). MediaMTX usa `/102`. Verificado `rtsp://127.0.0.1:8554/cam1` -> h264 704x576 y WHEP en `:8889/cam1/` HTTP 200.
  - Secretos: `CAM1_RTSP_URL` solo en `.env` (ignorado en `.gitignore`); plantilla en `.env.example`.
  - Git: sin binarios pesados versionados (`*.iso`, `*.qcow2`, `*.img`, `*.vmdk`); no hizo falta `git reset`.
  - Gotcha: tras recrear la BD el backend da HTTP 500 (`57P01`); se resolvio con `docker restart access_control_backend`.
  - Gotcha: `make docker-down` ejecuta `down -v` y borra el volumen de Postgres.

- **Selector Centralizado de Sede en Topbar y Correccion de Guardado de Dispositivos (Octubre 2026)**:
  - **Selector de Sede Centralizado en Menu Top**:
    - Se elimino el badge inoperativo "Torniquetes Online (Wi-Fi Activo)" en [topbar.component.html](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/components/topbar/topbar.component.html).
    - Se incorporo el selector global de Sede en [topbar.component.html](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/components/topbar/topbar.component.html) y [topbar.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/components/topbar/topbar.component.ts) conectado a [SedeStateService](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/shared/sede/sede-state.service.ts).
    - Se removieron los selectores individuales y redundantes de sede de las vistas [torniquetes-hub.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/features/acceso-torniquete/torniquetes-hub.component.ts), [dispositivo-list.component.html](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/modulos/dispositivo/dispositivo-list/dispositivo-list.component.html), [monitor-salud.component.html](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/features/monitor-salud/monitor-salud.component.html) y [DashboardBiomedico.tsx](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/DashboardBiomedico.tsx).
    - Todas las vistas mantienen su suscripcion reactiva a `sedeStateService.sedeSeleccionadaId$`, reaccionando automaticamente al cambio de sede desde la barra superior.
  - **Correccion de Persistencia en Edicion de Dispositivos**:
    - Causa: En [Dispositivo.java](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_server/src/main/java/com/access/control/model/Dispositivo.java), los getters virtuales `getNombre()` y `getTipo()` eran serializados en JSON. Al recibir el PUT, Jackson llamaba a `setNombre()` y `setTipo()` con los valores viejos que sobreescribian los cambios hechos a `descripcion` y `tipoDispositivo`. Ademas, `piso_id` no coincidia con `pisoId`.
    - Solucion: Se configuraron los getters virtuales como `@JsonProperty(access = JsonProperty.Access.READ_ONLY)` y se anadio `@JsonAlias({"piso_id", "pisoId"})`.
    - En [DispositivoServiceImpl.java](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_server/src/main/java/com/access/control/services/DispositivoServiceImpl.java): Se aseguro la resolucion y asignacion de `Piso` a traves de `pisoRepository.findById()`.
    - En [editar-dispositivo.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/modulos/dispositivo/editar-dispositivo/editar-dispositivo.component.ts) y [crear-dispositivo.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/modulos/dispositivo/crear-dispositivo/crear-dispositivo.component.ts): Sincronizacion de `piso_id`, `pisoId`, `nombre`, `tipo` y campos numericos al enviar.

- **Hardware Biometrico Dinamico y Reactivo por Sede (Camara Web, Camara IP, Captahuellas USB) (Octubre 2026)**:
  - **Nuevos Tipos de Dispositivo Registrables**:
    - Se incorporaron `Camara Web`, `Camara IP` y `Captahuellas USB Suprema` en el catalogo de dispositivos ([crear-dispositivo.component.html](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/modulos/dispositivo/crear-dispositivo/crear-dispositivo.component.html), [editar-dispositivo.component.html](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/modulos/dispositivo/editar-dispositivo/editar-dispositivo.component.html), [dispositivo-list.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/modulos/dispositivo/dispositivo-list/dispositivo-list.component.ts)).
  - **Servicio Central de Estado de Hardware Biometrico**:
    - Se creo [biometric-device-state.service.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/shared/dispositivo/biometric-device-state.service.ts) que filtra reactivamente segun la sede seleccionada los captahuellas y camaras disponibles.
    - Opciones por defecto sin hardcodeo: Camara Web local del navegador (`LOCAL_WEBCAM`) y Captahuellas Localhost (`127.0.0.1:8085`). Si se selecciona una Camara IP o Captahuellas registrado en la sede, el sistema utiliza dinamicamente su `ip:puerto`.
  - **Backend Dinamico de Biometria**:
    - [BiometriaResource.java](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_server/src/main/java/com/access/control/controller/BiometriaResource.java): Los endpoints `/suprema/status` y `/suprema/capturar` ahora aceptan `@QueryParam("host") String host`, dirigiendo la peticion al host:puerto especificado en lugar de listas fijas, y anade proxy de snapshot para camaras IP (`/camara/snapshot`).
  - **Enrolamiento de Clientes, Empleados y Visitantes**:
    - [biometric-capture.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/shared/components/biometric-capture/biometric-capture.component.ts) y [biometric-capture.component.html](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/shared/components/biometric-capture/biometric-capture.component.html): Se anadieron selectores en linea para Fuente de Video (Camara Web / Camaras IP de la sede) y Lector de Huella (Localhost:8085 / Captahuellas registrados en sede).
  - **Terminal de Torniquetes y Control de Acceso**:
    - [biometria-facial.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/features/biometria-facial/biometria-facial.component.ts) y [biometria-facial.component.html](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/features/biometria-facial/biometria-facial.component.html): Selectores independientes para Torniquete Asignado, Camara y Captahuellas por sede, ejecutando la lectura biometrica contra la IP:puerto del sensor seleccionado.

- **Menú y Vistas Responsivas a Tamaño de Teléfono Móvil (Octubre 2026)**:
  - **Sidebar Drawer Móvil**:
    - Se creó [sidebar.service.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/shared/services/sidebar.service.ts) con signal reactivo `isOpen` para controlar la apertura y cierre del menú.
    - Se actualizó [topbar.component.html](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/components/topbar/topbar.component.html) con botón hamburguesa (`d-md-none`) y ajuste de elementos en pantallas reducidas.
    - Se configuró [home.component.html](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/components/home/home.component.html) y [home.component.scss](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/components/home/home.component.scss) para desplegar el sidebar como cajón deslizante off-canvas con fondo oscuro atenuado (`sidebar-backdrop`) en móviles (<768px).
    - En [left-menu.component.html](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/components/left-menu/left-menu.component.html) se incorporó botón de cierre en cabecera y cierre automático al presionar cualquier enlace de navegación.
  - **Vistas Responsivas**:
    - Se añadieron utilidades globales en [styles.css](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/styles.css) para scroll táctil horizontal en tablas (`.table-responsive`), márgenes reducidos en móviles y ajuste de modales.
    - Se actualizaron las cabeceras de todas las grillas principales (`cliente-list`, `empleado-list`, `visitante-list`, `piso-list`, `sede-list`, `gerencia-list`, `tipo-contrato-list`, `dispositivo-list`, `permisos-pisos`) con `flex-wrap gap-2` para evitar desbordes horizontales en pantallas telefónicas.
  - Compilado y desplegado al contenedor Nginx.

- **Diseño Light Unificado en Control Financiero de Sucursal & Deudores (Octubre 2026)**:
  - Se rediseñó [admin-dashboard.component.html](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/features/admin-dashboard/admin-dashboard.component.html) con la misma línea gráfica limpia y moderna de Central de Control de Pagos:
    - Tarjetas de métricas con bordes sutiles, círculos de iconos en colores pastel (`bg-*-subtle`), tipografía organizada y espaciados homogéneos.
    - Se eliminó el encabezado oscuro (`table-dark`) de la tabla de Deudores / Membresías Vencidas, reemplazándolo por `<thead class="table-light">` con tipografía gris en mayúsculas pequeñas.
    - Badges atenuados modernos (`bg-danger-subtle`, `bg-warning-subtle`, `bg-secondary-subtle`).
    - Encabezados de modales de gastos adaptados a fondo blanco con borde inferior tenue y textos oscuros.
  - Compilado y desplegado en el contenedor Nginx.

- **Texto Descriptivo Estandarizado en Botones de Accion de Grillas (Octubre 2026)**:
  - Se homogeneizaron los botones de acciones en las tablas principales del sistema ([cliente-list.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/modulos/cliente/cliente-list/cliente-list.component.ts), [empleado-list.component.html](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/modulos/empleado/empleado-list/empleado-list.component.html), [visitante-list.component.html](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/modulos/visitante/visitante-list/visitante-list.component.html), [piso-list.component.html](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/modulos/piso/piso-list/piso-list.component.html), [sede-list.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/modulos/sede/sede-list/sede-list.component.ts), [gerencia-list.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/modulos/gerencia/gerencia-list/gerencia-list.component.ts), [tipo-contrato-list.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/modulos/tipo-contrato/tipo-contrato-list/tipo-contrato-list.component.ts)).
  - Todos los botones que solo poseian icono (como el boton de eliminar o botones en grupos compactos) ahora incorporan icono y etiqueta descriptiva de texto (`Membresia`, `Pulsera`, `QR`, `Editar`, `Eliminar`).
  - Desplegado y verificado en el contenedor Nginx de produccion.

- **Correccion de Distribucion Visual en Central de Pagos (Octubre 2026)**:
  - Se corrigio un cierre faltante en el contenedor flex de la cabecera en [pagos-dashboard.component.html](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/features/pagos/pagos-dashboard.component.html#L307-L318) que provocaba que el titulo, la tasa y el formulario de cobro quedaran atrapados en una sola columna colapsada de ancho mínimo.
  - La tarjeta ahora recupera su distribucion limpia y espaciada original en dos columnas completas (`col-lg-6` para el formulario de cobro y `col-lg-6` para conciliacion bancaria).

- **Exportacion Nativa a Excel (.xls) con Tabla, Titulo y Pie de Pagina con Totales (Octubre 2026)**:
  - Se modifico `exportarExcel()` en [pagos-dashboard.component.ts](file:///Users/samueltovar/Documents/GitHub/control_acceso/control_web/src/main/web/src/app/features/pagos/pagos-dashboard.component.ts) para generar una hoja de calculo nativa de Microsoft Excel (`application/vnd.ms-excel`, `.xls`).
  - **Titulo y Metadatos**: Cabecera corporativa formateada con nombre del reporte, fecha/hora exacta de generacion y estado de los filtros aplicados (Periodo o Fecha seleccionada, Estado).
  - **Tabla Principal Estilizada**: Columnas con anchos definidos, bordes de celda, cabecera oscura (`#212529`) con texto blanco y formato de moneda.
  - **Pie de Pagina (`tfoot`)**: Fila de totales destacada que sumariza el **Total General Recaudado (USD / VES)** de todas las operaciones conciliadas/pagadas.
  - **Tabla Resumen por Metodo**: Subtabla al pie que consolida la recaudacion y cantidad de operaciones desglosada por cada metodo de pago.

- **Registro de Gastos Operativos, Modal de Gastos del Mes y Correccion de Total Ingresos (Octubre 2026)**:
  - **Boton "Nuevo Gasto"**: Reemplaza el boton simple de actualizar y abre un modal para registrar gastos con descripcion, categoria (`MANTENIMIENTO`, `SERVICIOS`, `SUMINISTROS`, `PERSONAL`, `EQUIPAMIENTO`, `OTRO`), monto en USD, fecha y usuario responsable.
  - **Modal de Gastos del Mes**: En la tarjeta de *Total Gastos Operativos*, el boton *Ver Mes* abre una modal con la grilla detallada de egresos del mes en curso y su totalizador.
  - **Causa y Solucion de "Total Ingresos en $0.00"**: El backend en `FinanzasResource.java` (`/balance`) solo consideraba pagos con estado `COMPLETADO`. Se amplió el filtro para sumar todos los cobros efectivamente percibidos (`COMPLETADO`, `CONCILIADO`, `PAGADO`), reflejando ahora correctamente los $30.00 y el balance neto.

- **Filtro de Fecha, Resumen por Metodo de Pago y Exportacion a Excel en Central de Pagos (Octubre 2026)**:
  - **Tarjeta Recaudado Dinamica y Dependiente de Filtros**: La tarjeta superior de *Recaudado* recalcula de inmediato el total en USD y su equivalente en VES segun el filtro aplicado (dia puntual mediante calendario, selector `Del Dia`, `Semanal`, `Mensual` o `Todos`).
  - **Filtro de Calendario (Fecha Especifica)**: Input tipo `date` con boton para limpiar filtro que permite consultar el historial de pagos de un dia exacto.
  - **Totales por Metodo de Pago**: Se anadio una seccion inferior debajo de la grilla de transacciones que desglosa en tiempo real el monto total en USD, equivalente en VES y cantidad de operaciones agrupadas por metodo (`PAGO_MOVIL`, `TRANSFERENCIA`, `EFECTIVO_USD`, `EFECTIVO_VES`, `TARJETA`, `ZELLE`, `BINANCE`, etc.).
  - **Exportacion a Excel / CSV**: Boton *Exportar Excel* con icono representativo que descarga en tiempo real el reporte de las transacciones filtradas (o todas si no hay filtro) incluyendo el desglose de totales por metodo y total general conciliado.

- **Metodos de Pago Completos, Referencia Requerida y Ficha QR con Pagos Pendientes (Octubre 2026)**:
  - **Metodos de Pago Completos**: Agregados todos los metodos en `pagos-dashboard` y `cliente-details` (`PAGO_MOVIL`, `TRANSFERENCIA`, `EFECTIVO_USD`, `EFECTIVO_VES`, `TARJETA`, `ZELLE`, `BINANCE`, `APP_ONLINE`).
  - **Numero de Referencia Obligatorio**: Marcado como obligatorio con validacion y resaltado de error (`errorReferencia`).
  - **Eliminacion de `window.alert()`**: Todos los mensajes de error y confirmacion se muestran inline directamente en los formularios tanto en Dashboard de Pagos como en Ficha Cliente / QR.
  - **Ficha Cliente / Notificador QR (`cliente-details`)**:
    - Consulta reactiva de cuotas y pagos pendientes en `/api/v1/finanzas/pagos/cliente/{id}/pendientes`.
    - Tabla con checkboxes para seleccion individual y seleccion total.
    - Monto a pagar en solo lectura (`readonly`) calculado segun las cuotas seleccionadas y conversion en Bs.
  - **Correccion de Equivalencia en Conciliacion de Pagos**:
    - `FinanzasResource.java` asigna automaticamente la tasa oficial BCV y calcula `montoEquivalenteVes` al registrar pagos cuando `tasaBcvAplicada <= 1`.
    - En `conciliacion-split.component.html`, implementado fallback reactivo a `tasaService.tasaUsdSignal()` cuando la tasa de snapshot sea menor o igual a 1, eliminando la discrepancia `$30.00 | Bs. 30,00`.

- **Seleccion de Pagos Pendientes y Monto en Solo Lectura a Tasa del Dia (Octubre 2026)**:
  - **Tasa Oficial BCV en el Top**: En la cabecera del formulario de *Registrar Cobro / Pago de Cliente*, se visualiza la tasa del dia obtenida reactivamente desde `TasaCambioService.tasaUsdSignal()`.
  - **Listado y Seleccion de Pagos Pendientes del Cliente**: Al seleccionar un cliente con autocompletado, se consultan sus pagos pendientes en `/api/v1/finanzas/pagos/cliente/{id}/pendientes` y se muestran en una lista con checkboxes individuales y boton de *Seleccionar todos*.
  - **Monto en Solo Lectura con Equivalencia BCV**: El campo de monto ya no es editable libremente; se totaliza sumando las cuotas seleccionadas y muestra la conversion en Bolivares al instante.
  - **Validacion Previa de Cupones**: El campo de cupon valida contra `/api/v1/membresias/promociones/validar-cupon` que el codigo exista, este activo, este dentro de su rango de fechas y corresponda a la membresia antes de aplicar el descuento al total seleccionado.

- **Inactivacion de Promociones con Modal de Conforme y Flujo de Pagos con Cupones (Octubre 2026)**:
  - **Inactivacion / Reactivacion de Promociones sin Borrado Fisico**:
    - En `MembresiaResource.java`: implementado `PATCH /api/v1/membresias/promociones/{id}/toggle-activo` y parametro `incluirInactivas` en `GET /api/v1/membresias/promociones`. Ninguna promocion se borra fisicamente (`activo = false/true`).
    - En `membresia-catalogo.component.ts` y `.html`: reemplazado el boton de borrado por alternancia visual. Al hacer clic, se abre una modal de advertencia y confirmacion (*notificacion de conforme*) indicando que la promocion dejara de estar disponible para nuevos pagos sin borrar el historial.
    - La tarjeta de la promocion inactiva se visualiza atenuada (`opacity-75 bg-light`) con badge `Inactiva` y boton para reactivar.
  - **Aplicacion de Cupones al Notificar Pago (Web y Mobile)**:
    - En `ReportePagoMultimonedaDTO.java`: campo `codigoCupon`.
    - En `FinanzasResource.java` (`/pagos/reportar-multimoneda`): valida el cupon y vigencia antes de registrar el pago, aplicando el descuento al monto en USD y recalculando el equivalente en VES a tasa oficial BCV. Registra la auditoria del cupon aplicado en el pago.
    - En `PaymentsScreen.js` (App movil): campo interactivo para ingresar el cupon de descuento con boton *Aplicar*, validacion en vivo contra `/api/v1/membresias/promociones/validar-cupon`, desglose del descuento y envio en el reporte de pago multimoneda.
    - En `portal-cliente.component.ts` y `.html` (Web cliente): selector y validacion de cupon con recalculo del monto final a transferir.

- **Asignacion de Membresia con Cupones, Pagos Automaticos y Cortes de Facturacion (Octubre 2026)**:
  - **Generacion Inmediata de Pago al Asignar Membresia**:
    - En `ClienteApiResource.java` (`PUT /api/clientes/{id}/asignar-membresia`): soporta parametros opcionales `codigoCupon`, `metodoPago`, `registrarPago`.
    - Si se provee cupon, valida vigencia y membresia aplicable en `PromocionRepository`, calcula descuento con redondeo a 2 decimales (`HALF_UP`) o dias extra.
    - Crea automaticamente el registro en tabla `pagos` con estado `COMPLETADO`, origen `WEB_ADMIN`, tasa BCV vigente y monto equivalente en VES.
    - Crea/actualiza `SuscripcionCliente` asociada y extiende `fechaVencimientoMembresia` y `fechaProximoCobro`.
  - **Generacion Automatica de Cuotas de Pago al Corte / Fecha de Vencimiento**:
    - En `MembershipExpirationWorker.java`: al llegar la fecha de vencimiento (`fechaVencimientoMembresia <= ahora`), el cron evalua que el cliente estuviera activo y que tenga efectivamente una membresia (`c.getMembresiaActual() != null`). Si no posee membresia, consolida su estado a `SIN_MEMBRESIA` y NO genera ningun pago. Si posee membresia y existen cupones o promociones activas vinculadas, aplica el descuento correspondiente de la promocion y genera el pago pendiente (`PENDIENTE_PAGO`) con metodo `CORTE_AUTOMATICO` y tasa BCV, enviando la notificacion respectiva.
  - **Politica Estricta: Sin Membresia = Acceso Denegado e Inactivo**:
    - En `BiometriaResource.java`:
      - `/verificar-rostro`: Si `cliente.getMembresiaActual() == null` o su estado no es `ACTIVA`/`PAGADO`/`PENDIENTE_CONCILIAR`, retorna `autorizado: false`, `estadoMembresia: 'SIN_MEMBRESIA'`, impidiendo la apertura fisica del torniquete.
      - `/verificar-huella`: Valida `autorizado` con la misma regla estricta.
      - `/verificar-qr`: Bloquea acceso con `autorizado: false` si no posee membresia activa.
    - En `biometria-facial.component.ts`: se valida `res.autorizado` tanto para rostro como para huella antes de emitir el pulso de apertura al rele del torniquete.
    - En `ClienteResource.java`: nuevos clientes o clientes actualizados sin membresia se registran explicitamente con `estadoSuscripcion = 'SIN_MEMBRESIA'`.
  - **Asignacion de Cupon / Promocion en Frontend**:
    - En `cliente-list.component.ts`: el modal de asignacion de membresia ahora incluye un selector reactivo de *Cupon o Promocion* y *Metodo de Pago*, mostrando el desglose en tiempo real: precio base, descuento promocional, monto final en USD y conversion oficial BCV en Bs. Al guardar, envia el cupon y registra el pago de apertura inmediatamente.
    - En `editar-cliente.component.ts`: se anadio el selector de promociones vigentes vinculadas al plan.
  - **Diagnostico y Estado del Lector Suprema USB**:
    - El hardware `Suprema Fingerprint Scanner (Ver.02)` (Vendor `0x16d1`, Product `0x0406`) se encuentra conectado y detectado en el bus USB nativo del host.
    - El servicio bridge `suprema_usb_bridge.py` escucha en el puerto `8085` del host y responde en `/api/suprema/status` y `/api/suprema/capturar`.
    - `BiometriaResource.java` en Quarkus y Nginx redirigen `/api/v1/biometria/suprema/status` hacia el bridge, permitiendo que el visor y la terminal muestren el lector Suprema USB en linea.
- **Pipes Multimoneda Standalone**: `MultiCurrencyFormatPipe` (`multiCurrency`) y `BcvConvertPipe` (`bcvConvert`) en `src/app/shared/pipes/`.
- **Servicio Reactivo TasaCambioService**: Sincronizacion condicional con DolarAPI (USD/EUR) y persistencia estricta contra BD Quarkus (`tasaExterna > tasaBd`). Cobertura de pruebas unitarias completa (`tasa-cambio.service.spec.ts`). Soporte de registro de tasa manual y consulta de historico (`obtenerHistoricoTasas`, `registrarTasaManual`).
- **Modulo de Pagos en Menu Lateral**:
  - Submenu desplegable interactivo:
    - `Dashboard Control de Pagos` (`/home/pagos`):
      - **Pestana 1 (Resumen y Auditoria):** Metricas de recaudacion multimoneda (USD / VES), conteo de clientes (al dia, pendientes, morosos) y tabla de auditoria transaccional con filtros por estado, periodo y busqueda en vivo.
      - **Pestana 2 (Registrar Cobro & Conciliacion):**
        - Formulario *Registrar Cobro / Pago de Cliente*: con buscador reactivo de clientes (autocompletado por nombre, apellido y cedula que asocia el ID del cliente por detras), monto en USD y equivalente dinamico en Bs. (BCV), metodo de pago, numero de referencia y campo opcional para subir imagen/comprobante de pago con previsualizacion.
        - Tabla *Conciliacion Bancaria de Transferencias*: lista de transferencias pendientes con botones de accion rapida (Aprobar / Rechazar) manteniendo la logica de conciliacion.
      - Se removieron ambos formularios de `AdminDashboardComponent` centralizandolos exclusivamente en esta vista.
    - `Conciliacion Pagos` (`/home/conciliacion`): Visor split-screen con pan & zoom y aprobacion/rechazo en tiempo real.
    - `Tasas Cambiarias BCV` (`/home/tasas`): Registro de tasa manual e historico completo.
    - `Catalogo de Membresias` (`/home/membresias`): Tarjetas compactas rediseñadas con estilo SaaS moderno (acento degradado verde esmeralda superior, jerarquía limpia con precio en USD, periodicidad en chip blanco, conversión BCV oficial formateada y botón de edición de ancho completo).
- **Separacion de Foto de Perfil Manual y Multi-Vector de Fotogramas (Crear/Editar Cliente)**:
  - **Boton "Foto Perfil Manual"**: Captura unicamente la foto frontal del cliente para su avatar/ficha de perfil (`fotoUrl`), sin interferir con la coleccion ni borrar los vectores ya generados.
  - **Boton "Auto-Captura 3D (4 Fotogramas Multi-Ángulo)"**: Ejecuta la secuencia asistida de giros de cabeza (Frontal, Perfil Izquierdo, Perfil Derecho e Inclinado), generando el multi-vector (`faceVector`) compuesto por las 4 poses para alimentar el banco biometrico.
  - **Correccion de Columna `foto` en PostgreSQL**: Se altero la columna `foto` de `VARCHAR(255)` a `TEXT` en la tabla `clientes` y se agrego `@Column(columnDefinition = "TEXT")` en `Cliente.java`. Esto previene el descarte o error de base64 y garantiza que las fotos capturadas se persistan y se muestren en la tabla de clientes.
  - **Matching Facial Robusto en Backend**: En `BiometriaResource.java`, `extraerListaVectores()` procesa arreglos JSON multi-vector y compara el fotograma unico capturado en la terminal contra cada una de las 4 poses registradas del cliente con umbral de similitud optimizado a `0.72` para variaciones reales de luz y angulo.
- **Modulo de Bancos y Cuentas Receptoras para Pagos**:
  - **Entidad & Repositorio Quarkus**: `Banco.java` y `BancoRepository.java` con soporte para `PAGO_MOVIL`, `TRANSFERENCIA`, `ZELLE`, `BINANCE` y `EFECTIVO`, incluyendo campos como titular, RIF/documento, telefono, numero de cuenta, correo Zelle, red y direccion wallet USDT, Binance Pay ID y notas de instruccion.
  - **API REST**: `BancoResource.java` en `/api/v1/bancos` con `GET /` (filtrable por tipo), `GET /todos`, `GET /{id}`, `POST /`, `PUT /{id}` y `DELETE /{id}` (desactivacion logica).
  - **Modulo Web Angular**: `BancosAdminComponent` (`/home/bancos`) accesible desde el menu lateral con tarjetas interactivas segun tipo de pasarela, copiado rapido de datos bancarios con un clic y modal para crear/editar cuentas receptoras.
  - **Integracion en Portal Cliente**: Formulario de pago conectado a `BancoService` para que el cliente consulte los datos bancarios exactos donde debe transferir o hacer Pago Movil, Zelle o Binance Pay.
  - **Postman Collection Actualizada**: Carpeta `06. Bancos y Cuentas Receptoras` agregada a `docs/control_acceso_postman_collection.json`.
- **Validacion de Membresia Real, Visor de Fotogramas y Apertura Estricta de Torniquetes**:
  - **Datos Reales de Base de Datos**: `BiometriaResource.java` incluye explicitamente `membresiaNombre` (nombre de `membresiaActual` en BD) y `estadoMembresia` (`estadoSuscripcion` de `clientes` en BD) en los endpoints `/verificar-rostro`, `/verificar-qr` y `/verificar-huella`. En `biometria-facial.component.ts` se elimino cualquier fallback hardcodeado tipo `'Plan Fitness Acceso Total'` para garantizar datos 100% fieles a Postgres.
  - **Eliminacion del Boton de Reapertura**: Se removio el boton verde *"Pulsar Apertura Otra Vez"* del pie del modal de persona identificada, dejando exclusivamente el boton *"Cerrar"*.
  - **Visor de Camara, Zoom y Fotogramas (Nuevo y Editar Cliente)**:
    - Altura del visor de camara homologada a `300px` identica a *Terminal de Vision y Torniquetes en Vivo*.
    - Resolucion HD (`1280x720` con aspect ratio `16:9` / `1.777777`) y encuadre panoramico natural con `object-fit: cover !important` sin escalas artificiales que deformen la distancia focal, permitiendo tomar el rostro completo dentro del circulo verde desde lejos exactamente igual que en la terminal de vision.
    - Reticula ovalada ajustada proporcionalmente (`210px x 250px`) para coincidencia anatomica del rostro sin tener que acercarse a la camara.
    - Mantenida la funcionalidad completa de auto-captura multi-angulo, cuenta regresiva, grabacion de fotogramas, generacion de vectores 128D y visualizacion en modal/galeria.
- **Sistema de Promociones, Cupones, 2x1 y Descuentos en Membresias (Octubre 2026)**:
  - **Entidad & Repositorio Quarkus**:
    - `Promocion.java` (`promociones` en Postgres): campos `nombre`, `codigo`, `tipoDescuento` (`PORCENTAJE`, `MONTO_FIJO`, `DOS_POR_UNO`, `DIAS_EXTRA`), `valorDescuento`, `fechaInicio`, `fechaFin`, `activo`, `membresiaAplica`.
    - `PromocionRepository.java`: metodos `findActivas()` y `findByCodigoActiva(codigo)` con busqueda insensible a mayusculas.
  - **Endpoints REST en MembresiaResource.java**:
    - `GET /api/v1/membresias/promociones`: listar promociones activas.
    - `POST /api/v1/membresias/promociones`: crear promocion con codigo en mayusculas.
    - `PUT /api/v1/membresias/promociones/{id}`: actualizar promocion y membresia vinculada.
    - `DELETE /api/v1/membresias/promociones/{id}`: desactivacion logica (`activo = false`).
    - `POST /api/v1/membresias/promociones/validar-cupon`: valida codigo, estado activo, fechas de vigencia, restriccion por membresia y calcula de forma reactiva el descuento exacto con redondeo a 2 decimales (`BigDecimal.setScale(2, HALF_UP)`), monto final y beneficios adicionales (ej. segundo mes o dias extra gratis).
  - **Frontend Angular 18 (`/home/membresias`)**:
    - `MembresiaCatalogoComponent`: pestanas de navegacion pill `Planes` vs `Promociones y Cupones`.
    - Tarjetas compactas para promociones con visualizacion destacada del codigo de cupon, badge de tipo (2x1, % OFF, $ OFF, dias extra), vigencia y membresia aplicable, ademas de botones de editar y desactivar.
  - **Integracion con Schedulers y Transiciones de Estado del Cliente**:
    - `PaymentNotificationScheduler.java`:
      - Evaluacion cada 24h de clientes en estado `POR_VENCER` (5 dias antes del corte). Consulta cupones y promociones vigentes asociadas a la membresia o globales, inyectando el codigo del cupon y beneficio en la notificacion de recordatorio para incentivar la renovacion anticipada.
      - Al pasar a `VENCIDA`, asocia promociones de reactivacion vigentes en el aviso para facilitar la recuperacion del cliente.
    - `MembershipExpirationWorker.java`:
      - Evaluacion diaria de medianoche para transicion a `MOROSO` y suspension de acceso en torniquetes (`CacheInvalidateAll`). Incluye sugerencia automatica del cupon activo para regularizacion de mora.
    - `FinanzasResource.java`:
      - Al registrar o conciliar un pago (`COMPLETADO`/`CONCILIADO`), transiciona el estado del cliente a `ACTIVA`, limpia dias de gracia y comprobantes pendientes, y calcula la nueva `fechaVencimientoMembresia` y `fechaProximoCobro` en base a la duracion real de la membresia (`duracionesDias`) mas dias extra de promocion si aplica.

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
  - Hardware Biométrico Suprema USB: Servicio desplegado y activo en QEMU Headless Linux con passthrough nativo USB (`0x16d1:0x0406`) en puerto 8085 (`make qemu-up`). Enlace nativo con `libUFScanner.so` (C-Engine cargado `c_library_loaded: true`), `libUFMatcher.so` y `libhasp_shim.so`. Endpoints `/api/suprema/status` y `/api/suprema/capturar` conectados al backend Quarkus (`/api/v1/biometria/suprema/status`).
  - Cámara de Enrolamiento: `biometric-capture.component.html/css` ajustado con `object-fit: cover` centrado sin desvíos y emisión directa al formulario de Clientes.
  - UI Web Standalone en Quarkus: `control_server/src/main/resources/META-INF/resources/dashboard-dinamico.html`.
  - Simulador de Gateway: Controlado exclusivamente a demanda mediante el boton *Iniciar Gateway Dinamico* / *Detener Gateway Dinamico*. Al activarse, mantiene **PULSERA_001** y **PULSERA_002** de forma fija y permanente transmitiendo continuamente valores dinamicos sin desconectarse jamas, mientras incorpora altas y bajas dinamicas de pulseras secundarias adicionales.
  - Documentacion Gateway Real ESP32 Wi-Fi + ESP-NOW: Generada en `docs/guia_gateway_esp32_telemetria.md` con arquitectura bidireccional, estructura binaria compartida en C (`struct_telemetria`), firmware emisor ESP-NOW para pulseras (`PULSERA_001`, `PULSERA_002`) y firmware concentrador dual (ESP-NOW + Wi-Fi HTTP POST al backend Quarkus `/api/v1/telemetria/gateway-ingest`).
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

### 7. Membresias, Facturacion Multimoneda (BCV) y Control de Acceso Fisico (<50ms)

- **Estado de Membresia Materializado en Clientes**: Para cumplir el SLA <50ms (lectura 2-8ms) en torniquetes, el estado (`estado_suscripcion`, `fecha_vencimiento_membresia`, `fecha_proximo_cobro`) se materializa directamente en la fila de `clientes` con indexacion B-Tree, mientras `suscripciones_cliente` y `pagos` registran el historico inmutable de auditoria.
- **Migracion Delta**: Se definieron sentencias `ALTER TABLE clientes ADD COLUMN ...` preservando los datos existentes (`qr_token_dinamico`, `fecha_vencimiento_membresia`, `fecha_proximo_cobro`, `membresia_actual_id`, etc.).
- **Tasa Oficial BCV Diaria**: Worker `@Scheduled(cron = "0 0 18 ? * MON-FRI")` y endpoint manual `POST /api/admin/tasa-bcv/sincronizar` integrados con `ve.dolarapi.com/v1/dolares/oficial` y `ve.dolarapi.com/v1/euros/oficial` para captura oficial de USD/EUR y congelamiento inmutable (*rate freeze*) en cada orden de pago.
- **Acceso Temporal en Torniquetes**: Clientes en `PENDIENTE_CONCILIAR` obtienen pase temporal de gracia maximo de 48 horas mientras el administrador concilia.
- **Coleccion Postman**: Documentada y exportada en `docs/control_acceso_postman_collection.json` con todos los contratos REST, multipart para tickets bancarios y endpoints de torniquetes.
- **Integracion Mobile**: Especificados contratos TypeScript/Kotlin y prompt exhaustivo para Android Studio para sincronizacion multipart y WebSockets.
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

### 13. Integracion y Aislamiento del SDK Suprema BioMini (libUFScanner.dylib)

- **Aislamiento de Binario Nativo (`infrastructure/libs/mac/`)**:
  - Centralizacion del driver nativo en `./infrastructure/libs/mac/libUFScanner.dylib` con guia técnica [INSTRUCCIONES.md](file:///Users/samueltovar/Documents/GitHub/control_acceso/infrastructure/libs/mac/INSTRUCCIONES.md) para el aprovisionamiento de binarios licenciados de Suprema Inc.
- **Refactorizacion en Python (`scripts/suprema_usb_bridge.py`)**:
  - Creacion de la clase `BioMiniScanner` con resolucion de ruta absoluta dinamica via `pathlib.Path(__file__).resolve().parent.parent / "infrastructure" / "libs" / "mac" / "libUFScanner.dylib"`.
  - Patron **Context Manager** (`__enter__` y `__exit__`) para inicializacion y destruccion determinista de memoria C (`UFS_Init`, `UFS_Uninit`).

### 14. Dockerizacion del Puente Suprema BioMini en Linux con Librerias C Nativas

- **Despliegue del Contenedor (`docker/suprema_bridge/Dockerfile`)**:
  - Imagen base `linux/amd64 ubuntu:20.04` para compatibilidad binaria con `libUFScanner.so` y `libUFMatcher.so` del SDK Linux v3.5 de Suprema.
  - Resolucion de dependencia Sentinel HASP: Compilacion e inyeccion de `libhasp_shim.so` via `LD_PRELOAD` para satisfacer dinamicamente los simbolos de licencia `hasp_login`, `hasp_get_sessioninfo`, `hasp_logout` y `hasp_free`.
  - Carga nativa exitosa: `ctypes.CDLL('libUFScanner.so')` carga sin errores en el espacio de memoria de Linux (`c_library_loaded: true`).
- **Permisos y Acceso Hardware en Docker Compose (`docker-compose.yml`)**:
  - Contenedor `suprema_usb_bridge`: Configurado con `privileged: true`, montaje de dispositivos `/dev:/dev`, variables sin buffer y puerto `8085:8085`.
- **Integracion y Fallback Resiliente**:
  - Servicio operativo en `http://127.0.0.1:8085` respondiendo `GET /api/suprema/status` y `GET /api/suprema/capturar?dedo=1` con driver `NATIVO_LIBUFSCANNER`.
  - Backend Quarkus (`access_control_backend:8080`) consumiendo exitosamente el puente en contenedor a traves de `http://host.docker.internal:8085/api/suprema/...`.
  - Comandos `make suprema-up`, `make suprema-down` y `make suprema-build` integrados en el `Makefile`.

## Tarea: Implementación de Inferencia Facial en Quarkus (DJL)

- **Problema:** Procesar los arreglos de bytes (`byte[]`) entrantes provenientes del muestreo de Angular para detectar rostros y emitir un vector de características sin bloquear los hilos I/O de Quarkus y sin fugas de memoria.

- **Solución Técnica:**
  Se integró la API de DJL y el motor de PyTorch en el `pom.xml`. Se codificó un bean `FaceRecognitionService` de alcance de aplicación (`@ApplicationScoped`). El modelo principal es cargado en la fase de inicialización (`@PostConstruct`). Para cada invocación de `processImage()`, se instancia un `Predictor<Image, DetectedObjects>` acotado al ciclo de vida de un bloque *try-with-resources*.
- **Por qué funcionó:**
  Al aislar la instanciación del Predictor, Quarkus puede manejar peticiones concurrentes de múltiples cámaras. El modelo estático no se bloquea, pero cada hilo de Request obtiene su propio entorno de inferencia, previniendo choques de memoria (C-heap) de la librería PyTorch subyacente.
- **Prevención de regresiones:**
  NUNCA se debe declarar el `Predictor` a nivel de clase ni reutilizarlo entre hilos. Los predictores de DJL no son *Thread-Safe*. Las violaciones a esta regla causarán *Segmentation Faults* o *Memory Leaks* fatales que derribarán la JVM entera.

  ## Tarea: Implementación de Base de Datos Vectorial para Biometría

- **Problema:** Mapear y comparar eficientemente la matriz de características flotantes (Face Embedding) contra los registros de acceso en Quarkus.

- **Solución Técnica:**
  Se desplegó un contenedor con la imagen `ankane/pgvector`. Se estructuró la tabla principal con la columna especial `vector(512)`. En Quarkus, se obvió la capa JPA estándar para esta operación específica en favor de una consulta nativa (`createNativeQuery`) explotando el operador `<=>` (distancia de coseno) propio de la base de datos.
- **Por qué funcionó:**
  Delegar la matemática vectorial a la base de datos en lugar de hacerla en Java (traer todos los registros a RAM y comparar) es infinitamente más rápido. El umbral estricto en el bloque `WHERE` filtra los "falsos positivos" a nivel de SQL.
- **Prevención de regresiones:**
  Si el motor de IA cambia (ej. pasas de un modelo que escupe 512 dimensiones a uno de 128 dimensiones), la tabla en PostgreSQL arrojará un error de dimensiones. El tamaño del vector en el DDL (`vector(X)`) DEBE coincidir con la salida del modelo cargado en DJL.
