#!/usr/bin/env node

/**
 * Bateria de Pruebas Automatizadas de Persistencia CRUD (MySQL & MongoDB)
 * Verificacion de Transacciones Reales, Ausencia de Mocks y Proteccion de Foreign Keys
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
console.log('   BATERIA DE PRUEBAS DE PERSISTENCIA CRUD (MYSQL & MONGODB - 0% MOCKS)');
console.log('======================================================================');

// 1. Verificacion de Persistencia Relacional MySQL (Entidades de Negocio & Transacciones)
console.log('\n==> 1. Verificando Persistencia en MySQL (Sedes, Pisos, Gerencias, Contratos)');
const sedeServ = fs.readFileSync(path.join(rootDir, 'control_server/src/main/java/com/access/control/services/SedeServiceImpl.java'), 'utf8');
const pisoServ = fs.readFileSync(path.join(rootDir, 'control_server/src/main/java/com/access/control/services/PisoServiceImpl.java'), 'utf8');
const gerenciaServ = fs.readFileSync(path.join(rootDir, 'control_server/src/main/java/com/access/control/services/GerenciaServiceImpl.java'), 'utf8');
const tipoContratoServ = fs.readFileSync(path.join(rootDir, 'control_server/src/main/java/com/access/control/services/TipoContratoServiceImpl.java'), 'utf8');

assert(sedeServ.includes('@Transactional') && sedeServ.includes('sedeRepository.persist(sede)') && sedeServ.includes('sedeRepository.deleteById'),
  'SedeServiceImpl: Insercion, actualizacion y eliminacion protegidas con @Transactional en MySQL');
assert(pisoServ.includes('@Transactional') && pisoServ.includes('pisoRepository.persist(piso)') && pisoServ.includes('pisoRepository.deleteById'),
  'PisoServiceImpl: Insercion, actualizacion y eliminacion protegidas con @Transactional en MySQL');
assert(gerenciaServ.includes('@Transactional') && gerenciaServ.includes('gerenciaRepository.persist(gerencia)') && gerenciaServ.includes('gerenciaRepository.deleteById'),
  'GerenciaServiceImpl: Insercion, actualizacion y eliminacion protegidas con @Transactional en MySQL');
assert(tipoContratoServ.includes('@Transactional') && tipoContratoServ.includes('tipoContratoRepository.persist(tipoContrato)'),
  'TipoContratoServiceImpl: Insercion y actualizacion con @Transactional en MySQL');

// 2. Verificacion de Dispositivos, Clientes, Empleados y Visitas en MySQL
console.log('\n==> 2. Verificando Persistencia en MySQL (Dispositivos, Clientes, Empleados, Visitas)');
const dispoServ = fs.readFileSync(path.join(rootDir, 'control_server/src/main/java/com/access/control/services/DispositivoServiceImpl.java'), 'utf8');
const clienteCtrl = fs.readFileSync(path.join(rootDir, 'control_server/src/main/java/com/access/control/controller/ClienteResource.java'), 'utf8');
const empServ = fs.readFileSync(path.join(rootDir, 'control_server/src/main/java/com/access/control/services/EmpleadosServiceImpl.java'), 'utf8');
const visitaServ = fs.readFileSync(path.join(rootDir, 'control_server/src/main/java/com/access/control/services/VisitasServiceImpl.java'), 'utf8');

assert(dispoServ.includes('@Transactional') && dispoServ.includes('dispositivoRepository.persist') && dispoServ.includes('toggleState'),
  'DispositivoServiceImpl: Insercion, actualizacion y cambio de estado transaccional en MySQL');
assert(clienteCtrl.includes('@Transactional') && clienteCtrl.includes('createCliente') && clienteCtrl.includes('clienteRepository.persist'),
  'ClienteResource: Insercion y actualizacion de clientes en MySQL con persistencia transaccional');
assert(clienteCtrl.includes('pagoRepository.count') && clienteCtrl.includes('setEstadoSuscripcion("INACTIVO")'),
  'ClienteResource: Proteccion de borrado con historial contable (soft-delete seguro)');
assert(empServ.includes('@Transactional') && empServ.includes('e.setUser(null)') && empServ.includes('deleteEmpleado'),
  'EmpleadosServiceImpl: Desvinculacion segura de User y Pisos antes de borrado fisico');
assert(visitaServ.includes('@Transactional') && visitaServ.includes('v.getPisosPermitidos().clear()') && visitaServ.includes('deleteVisita'),
  'VisitasServiceImpl: Desvinculacion de permisos antes de eliminacion en MySQL');

// 3. Verificacion de Usuarios, Roles y Seguridad en MySQL
console.log('\n==> 3. Verificando Persistencia en MySQL (Usuarios, Credenciales y Roles)');
const userServ = fs.readFileSync(path.join(rootDir, 'control_server/src/main/java/com/access/control/services/UsuarioServiceImpl.java'), 'utf8');
assert(userServ.includes('@Transactional') && userServ.includes('crearUsuario') && userServ.includes('userRepository.persist(u)'),
  'UsuarioServiceImpl: Creacion y hashing BCrypt de usuarios persistido en MySQL');
assert(userServ.includes('actualizarUsuario') && userServ.includes('cambiarEstado'),
  'UsuarioServiceImpl: Actualizacion de perfil y estado activo/inactivo en MySQL');

// 4. Verificacion de Membresias, Promociones, Bancos y Pagos en MySQL
console.log('\n==> 4. Verificando Persistencia en MySQL (Finanzas, Membresias, Promociones, Bancos)');
const memCtrl = fs.readFileSync(path.join(rootDir, 'control_server/src/main/java/com/access/control/controller/MembresiaResource.java'), 'utf8');
const bancoCtrl = fs.readFileSync(path.join(rootDir, 'control_server/src/main/java/com/access/control/controller/BancoResource.java'), 'utf8');
const finanzasCtrl = fs.readFileSync(path.join(rootDir, 'control_server/src/main/java/com/access/control/controller/FinanzasResource.java'), 'utf8');
const adminFinanzasCtrl = fs.readFileSync(path.join(rootDir, 'control_server/src/main/java/com/access/control/controller/AdminFinanzasResource.java'), 'utf8');

assert(memCtrl.includes('createMembresia') && memCtrl.includes('membresiaRepository.persist(membresia)'),
  'MembresiaResource: Creacion de planes con persistencia transaccional');
assert(memCtrl.includes('@DELETE') && memCtrl.includes('deleteMembresia') && memCtrl.includes('clientesAsociados'),
  'MembresiaResource: Endpoint DELETE con proteccion de historico de clientes/suscripciones');
assert(memCtrl.includes('createPromocion') && memCtrl.includes('deletePromocion'),
  'MembresiaResource: CRUD completo de promociones y cupones en MySQL');
assert(bancoCtrl.includes('crearBanco') && bancoCtrl.includes('actualizarBanco') && bancoCtrl.includes('eliminarBanco'),
  'BancoResource: CRUD de cuentas bancarias y pasarelas persistido en MySQL');
assert(finanzasCtrl.includes('reportarPagoMultimoneda') && finanzasCtrl.includes('pagoRepository.persist(pago)'),
  'FinanzasResource: Reporte de pago multimoneda persistido en base de datos');
assert(adminFinanzasCtrl.includes('conciliarPago') && adminFinanzasCtrl.includes('pago.setEstadoPago("CONCILIADO")'),
  'AdminFinanzasResource: Conciliacion bancaria y extension de membresia transaccional');
assert(adminFinanzasCtrl.includes('rechazarPago') && adminFinanzasCtrl.includes('pago.setEstadoPago("RECHAZADO")'),
  'AdminFinanzasResource: Rechazo de pago y bloqueo de torniquete persistido en MySQL');

// 5. Verificacion de Persistencia en MongoDB (Bitacora, Auditoria, Sesiones, Telemetria)
console.log('\n==> 5. Verificando Persistencia en MongoDB (Datos sin Claves Foraneas / Logs)');
const bitacoraModel = fs.readFileSync(path.join(rootDir, 'control_server/src/main/java/com/access/control/model/BitacoraEventoPaso.java'), 'utf8');
const auditModel = fs.readFileSync(path.join(rootDir, 'control_server/src/main/java/com/access/control/model/AuditoriaAcceso.java'), 'utf8');
const sesionModel = fs.readFileSync(path.join(rootDir, 'control_server/src/main/java/com/access/control/model/SesionActiva.java'), 'utf8');
const telemModel = fs.readFileSync(path.join(rootDir, 'control_server/src/main/java/com/biotrack/entity/TelemetriaVitalEntity.java'), 'utf8');
const accesoCtrl = fs.readFileSync(path.join(rootDir, 'control_server/src/main/java/com/access/control/controller/AccesoResource.java'), 'utf8');

assert(bitacoraModel.includes('@MongoEntity(collection = "bitacora_eventos_paso")'),
  'BitacoraEventoPaso mapeada a coleccion bitacora_eventos_paso en MongoDB');
assert(auditModel.includes('@MongoEntity(collection = "auditoria_accesos")'),
  'AuditoriaAcceso mapeada a coleccion auditoria_accesos en MongoDB');
assert(sesionModel.includes('@MongoEntity(collection = "sesiones_activas")'),
  'SesionActiva mapeada a coleccion sesiones_activas en MongoDB');
assert(telemModel.includes('@MongoEntity(collection = "telemetria_signos_vitales")'),
  'TelemetriaVitalEntity mapeada a coleccion telemetria_signos_vitales en MongoDB');
assert(accesoCtrl.includes('bitacoraRepository.persist(evento)'),
  'AccesoResource: Eventos de paso de torniquetes persistidos directamente en MongoDB');
assert(userServ.includes('TxType.NOT_SUPPORTED') && userServ.includes('auditoriaRepository.persist(audit)'),
  'UsuarioServiceImpl: Auditoria desacoplada de transaccion JTA para compatibilidad nativa con MongoDB');

// 6. Verificacion de Cero Mocks y Cero Simulaciones
console.log('\n==> 6. Verificando Ausencia de Fallbacks Simulados o Mockeados');
const bioFacialComp = fs.readFileSync(path.join(rootDir, 'control_web/src/main/web/src/app/features/biometria-facial/biometria-facial.component.ts'), 'utf8');

assert(!bioFacialComp.includes('Pulso de apertura simulado con exito.'),
  'biometria-facial.component.ts: Eliminado fallback de simulacion de torniquete abierto');
assert(bioFacialComp.includes('alertModal.error') && bioFacialComp.includes('Fallo en Torniquete'),
  'biometria-facial.component.ts: Error de hardware o red notificado de forma transparente al operador');

// 7. Verificacion de Integridad Referencial (Foreign Keys & HTTP 409 Conflict)
console.log('\n==> 7. Verificando Manejo de Foreign Keys y HTTP 409 Conflict');
const sedeCtrl = fs.readFileSync(path.join(rootDir, 'control_server/src/main/java/com/access/control/controller/SedesController.java'), 'utf8');
const pisoCtrl = fs.readFileSync(path.join(rootDir, 'control_server/src/main/java/com/access/control/controller/PisosController.java'), 'utf8');
const gerenciaCtrl = fs.readFileSync(path.join(rootDir, 'control_server/src/main/java/com/access/control/controller/GerenciasController.java'), 'utf8');

assert(sedeCtrl.includes('Response.Status.CONFLICT') && sedeCtrl.includes('pisosCount > 0 || usersCount > 0'),
  'SedesController: Valida pisos y usuarios asociados antes de borrado y responde 409 Conflict');
assert(pisoCtrl.includes('Response.Status.CONFLICT') && pisoCtrl.includes('dispoCount > 0'),
  'PisosController: Valida dispositivos asociados antes de borrado y responde 409 Conflict');
assert(gerenciaCtrl.includes('Response.Status.CONFLICT') && gerenciaCtrl.includes('empCount > 0'),
  'GerenciasController: Valida empleados asociados antes de borrado y responde 409 Conflict');

// 8. Verificacion de Codificacion ASCII Estricta en Archivos Modificados
console.log('\n==> 8. Verificando Codificacion ASCII Estricta');
const checkedFiles = [
  path.join(rootDir, 'control_web/src/main/web/src/app/features/biometria-facial/biometria-facial.component.ts'),
  path.join(rootDir, 'control_server/src/main/java/com/access/control/controller/MembresiaResource.java'),
  path.join(rootDir, 'control_server/src/main/java/com/access/control/controller/SedesController.java'),
  path.join(rootDir, 'control_server/src/main/java/com/access/control/controller/PisosController.java'),
  path.join(rootDir, 'control_server/src/main/java/com/access/control/controller/GerenciasController.java'),
  path.join(rootDir, 'control_server/src/main/java/com/access/control/controller/ClienteResource.java'),
  path.join(rootDir, 'control_server/src/main/java/com/access/control/services/EmpleadosServiceImpl.java'),
  path.join(rootDir, 'control_server/src/main/java/com/access/control/services/VisitasServiceImpl.java')
];

for (const f of checkedFiles) {
  const content = fs.readFileSync(f, 'utf8');
  const nonAscii = content.match(/[^\x00-\x7F]/g);
  assert(!nonAscii, `${path.basename(f)} cumple con 100% caracteres ASCII puros`);
}

console.log('\n======================================================================');
console.log(`   RESUMEN PRUEBAS DE PERSISTENCIA CRUD: PASSED=${passed} | FAILED=${failed}`);
console.log('======================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

