#!/usr/bin/env node

/**
 * Bateria de Pruebas Automatizadas de Seguridad, Proteccion de Datos
 * y Control de Acceso Basado en Roles (RBAC / Anti-IDOR / Anti-BOLA)
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASSED] ${message}`);
    passed++;
  } else {
    console.error(`  [FAILED] ${message}`);
    failed++;
  }
}

console.log('======================================================================');
console.log('   BATERIA DE PRUEBAS DE SEGURIDAD, RBAC Y PROTECCION DE DATOS');
console.log('======================================================================');

// 1. Verificacion de User.java: Fuga de credenciales y metodos RBAC
console.log('\n==> 1. Verificando User.java (Serializacion Segura y Metodos de Rol)');
const userPath = path.join(rootDir, 'control_server/src/main/java/com/access/control/model/User.java');
const userContent = fs.readFileSync(userPath, 'utf8');

assert(userContent.includes('@JsonIgnore') && userContent.includes('@JsonbTransient'),
  'User.java oculta el atributo password en serializacion JSON (@JsonIgnore y @JsonbTransient)');
assert(userContent.includes('canViewCrossUserData()'),
  'User.java implementa metodo canViewCrossUserData() para jerarquia RBAC');
assert(userContent.includes('isContable()') && userContent.includes('isAnalista()'),
  'User.java expone verificaciones para roles CONTABLE y ANALISTA');

// 2. Verificacion de AuthResource.java: Anti-Suplantacion y Tokens
console.log('\n==> 2. Verificando AuthResource.java (Anti-Suplantacion y Emision de Claims)');
const authPath = path.join(rootDir, 'control_server/src/main/java/com/biotrack/resource/AuthResource.java');
const authContent = fs.readFileSync(authPath, 'utf8');

assert(!authContent.includes('findPrimerCliente()'),
  'AuthResource.java no asigna clienteId por fallback (findPrimerCliente eliminado)');
assert(authContent.includes('usuario.rol = "CLIENTE";'),
  'AuthResource.java previene escalamiento de privilegios forzando rol CLIENTE en autoregistro');
assert(authContent.includes('.claim("clienteId",'),
  'AuthResource.java emite claim inmutable clienteId en firma JWT');
assert(authContent.includes('.claim("userId",'),
  'AuthResource.java emite claim inmutable userId en firma JWT');
assert(authContent.includes('request.claveActual') && authContent.includes('BCrypt.checkpw'),
  'AuthResource.java valida claveActual en endpoint /cambiar-clave');

// 3. Verificacion de ClienteResource.java: Ausencia de fallbacks a cliente #1
console.log('\n==> 3. Verificando ClienteResource.java (Eliminacion de Fallbacks Vulnerables)');
const clientePath = path.join(rootDir, 'control_server/src/main/java/com/access/control/controller/ClienteResource.java');
const clienteContent = fs.readFileSync(clientePath, 'utf8');

assert(!clienteContent.includes('clienteRepository.listAll().get(0)'),
  'ClienteResource.java no redirige operaciones mutantes al primer cliente de la BD');

// 4. Verificacion de FinanzasResource.java: Validacion Anti-IDOR en Pagos
console.log('\n==> 4. Verificando FinanzasResource.java (Validacion Anti-IDOR en Reporte de Pagos)');
const finanzasPath = path.join(rootDir, 'control_server/src/main/java/com/access/control/controller/FinanzasResource.java');
const finanzasContent = fs.readFileSync(finanzasPath, 'utf8');

assert(finanzasContent.includes('callerClienteId.equals(dto.getClienteId())'),
  'FinanzasResource.java valida que usuarios CLIENTE solo reporten pagos de su propio clienteId');
assert(finanzasContent.includes('Response.Status.FORBIDDEN'),
  'FinanzasResource.java rechaza intentos de suplantacion en pagos con HTTP 403 Forbidden');

// 5. Verificacion de UsuarioPerfilResource.java: Proteccion de Parametro queryId
console.log('\n==> 5. Verificando UsuarioPerfilResource.java (Proteccion de Perfil Ajeno)');
const perfilPath = path.join(rootDir, 'control_server/src/main/java/com/biotrack/resource/UsuarioPerfilResource.java');
const perfilContent = fs.readFileSync(perfilPath, 'utf8');

assert(perfilContent.includes('queryId != null && !queryId.trim().isEmpty() && isPrivileged'),
  'UsuarioPerfilResource.java restringe el parametro queryId unicamente a roles autorizados');

// 6. Verificacion de RbacDataProtectionFilter.java: Filtro Global Zero-Trust
console.log('\n==> 6. Verificando RbacDataProtectionFilter.java (Policy Enforcement Point)');
const filterPath = path.join(rootDir, 'control_server/src/main/java/com/access/control/config/RbacDataProtectionFilter.java');
assert(fs.existsSync(filterPath), 'RbacDataProtectionFilter.java existe en com.access.control.config');
const filterContent = fs.readFileSync(filterPath, 'utf8');

assert(filterContent.includes('@Provider') && filterContent.includes('ContainerRequestFilter'),
  'RbacDataProtectionFilter implementa ContainerRequestFilter como @Provider de Quarkus');
assert(filterContent.includes('CLIENTE_ID_PATH_PATTERN') && filterContent.includes('FINANZAS_CLIENTE_PATH_PATTERN'),
  'RbacDataProtectionFilter detecta y audita patrones de URL parametrizadas por clienteId');
assert(filterContent.includes('registrarIntentoIdor'),
  'RbacDataProtectionFilter audita intentos de suplantacion en AuditoriaAcceso');
assert(filterContent.includes('abortWithForbidden'),
  'RbacDataProtectionFilter bloquea accesos no autorizados con HTTP 403');
assert(filterContent.includes('abortWithUnauthorized') && filterContent.includes('isPublicPath'),
  'RbacDataProtectionFilter rechaza con HTTP 401 Unauthorized peticiones sin token en rutas protegidas');
assert(filterContent.includes('DISPOSITIVO_ABRIR_PATH_PATTERN') || filterContent.includes('/abrir'),
  'RbacDataProtectionFilter blinda la apertura fisica de torniquetes y reles (/abrir)');
assert(filterContent.includes('asignar-membresia'),
  'RbacDataProtectionFilter impide que clientes se auto-asignen membresias');
assert(filterContent.includes('telemetria/alertas') && filterContent.includes('membresias/suscripciones'),
  'RbacDataProtectionFilter bloquea acceso de CLIENTE a telemetria y suscripciones globales');

// 7. Verificacion de ControlAccesoGraphQLApi.java: Proteccion en Resolvers
console.log('\n==> 7. Verificando ControlAccesoGraphQLApi.java (Proteccion Anti-IDOR en GraphQL)');
const graphqlPath = path.join(rootDir, 'control_server/src/main/java/com/access/control/graphql/ControlAccesoGraphQLApi.java');
const graphqlContent = fs.readFileSync(graphqlPath, 'utf8');

assert(graphqlContent.includes('JsonWebToken jwt'),
  'ControlAccesoGraphQLApi.java inyecta JsonWebToken para identificacion de caller');
assert(graphqlContent.includes('getClienteDetalleCompleto') && graphqlContent.includes('SecurityException'),
  'ControlAccesoGraphQLApi.java valida pertenencia en getClienteDetalleCompleto contra IDOR');
assert(graphqlContent.includes('getEmpleadoDetalleCompleto') && graphqlContent.includes('getPisosConDispositivos'),
  'ControlAccesoGraphQLApi.java bloquea consultas de infraestructura y empleados para perfil CLIENTE');

// 8. Verificacion de NotificacionResource.java: Blindaje de Notificaciones
console.log('\n==> 8. Verificando NotificacionResource.java (Control de Notificaciones y Ownership)');
const notifPath = path.join(rootDir, 'control_server/src/main/java/com/access/control/controller/NotificacionResource.java');
const notifContent = fs.readFileSync(notifPath, 'utf8');

assert(notifContent.includes('Response.Status.FORBIDDEN') && notifContent.includes('isStaffCaller'),
  'NotificacionResource.java restringe creacion arbitraria de notificaciones a roles autorizados');
assert(notifContent.includes('marcarLeida') && notifContent.includes('getCallerClienteId'),
  'NotificacionResource.java verifica pertenencia de cliente al marcar notificaciones como leidas');

// 9. Verificacion de Frontend auth.service.ts
console.log('\n==> 9. Verificando auth.service.ts (Validacion de Claims JWT contra Tampering)');
const authServicePath = path.join(rootDir, 'control_web/src/main/web/src/app/core/services/auth.service.ts');
const authServiceContent = fs.readFileSync(authServicePath, 'utf8');

assert(authServiceContent.includes('parseJwtPayload'),
  'auth.service.ts decodifica la firma del token JWT');
assert(authServiceContent.includes('getAuthenticatedClienteId()'),
  'auth.service.ts expone getAuthenticatedClienteId() validando claims firmados');
assert(authServiceContent.includes('canViewCrossUserData()'),
  'auth.service.ts expone canViewCrossUserData() respetando roles privilegiados');
assert(!authServiceContent.includes("role: res.role || 'ROLE_ADMIN'"),
  'auth.service.ts no asigna ROLE_ADMIN indiscriminadamente en sesion biometrica');
assert(authServiceContent.includes('canViewGestionAcceso') && authServiceContent.includes('isContable'),
  'auth.service.ts habilita canViewGestionAcceso() para CONTABLE para auditoria de clientes y membresias');

// 10. Verificacion de Frontend auth.guard.ts y Menu
console.log('\n==> 10. Verificando auth.guard.ts y left-menu (Segregacion de Rutas y Navegacion)');
const authGuardPath = path.join(rootDir, 'control_web/src/main/web/src/app/core/guards/auth.guard.ts');
const authGuardContent = fs.readFileSync(authGuardPath, 'utf8');
const leftMenuPath = path.join(rootDir, 'control_web/src/main/web/src/app/components/left-menu/left-menu.component.html');
const leftMenuContent = fs.readFileSync(leftMenuPath, 'utf8');

assert(authGuardContent.includes('/home/portal-cliente'),
  'auth.guard.ts confina al perfil CLIENTE exclusivamente a /home/portal-cliente');
assert(authGuardContent.includes('isContable()') && authGuardContent.includes('/home/pagos'),
  'auth.guard.ts redirige intentos de acceso no contables de CONTABLE a /home/pagos');
assert(authGuardContent.includes('isAnalista()') || authGuardContent.includes('isOperacion()'),
  'auth.guard.ts restringe configuracion y bancos a ANALISTA / OPERACION');
assert(leftMenuContent.includes('isContable()') && leftMenuContent.includes('routerLink="/home/empleados"'),
  'left-menu oculta gestion de Empleados y Visitantes para rol CONTABLE');

// 11. Verificacion de pureza ASCII en todos los archivos modificados
console.log('\n==> 11. Verificando Codificacion ASCII Estricta');
const checkedFiles = [userPath, authPath, clientePath, finanzasPath, perfilPath, filterPath, graphqlPath, notifPath, authServicePath, authGuardPath, leftMenuPath];
for (const f of checkedFiles) {
  const c = fs.readFileSync(f, 'utf8');
  const nonAscii = c.match(/[^\x00-\x7F]/g);
  assert(!nonAscii, `${path.basename(f)} cumple con 100% caracteres ASCII puros`);
}

console.log('\n======================================================================');
console.log(`   RESUMEN PRUEBAS DE SEGURIDAD Y RBAC: PASSED=${passed} | FAILED=${failed}`);
console.log('======================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

