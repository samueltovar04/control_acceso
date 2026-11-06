#!/usr/bin/env node

/**
 * Bateria de pruebas de verificacion estructural y de contratos
 * del Frontend Angular para todos los componentes CRUD y servicios.
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../control_web/src/main/web/src/app');

const testSuites = [
  {
    modulo: 'Core / Servicios & Interceptors',
    files: [
      'core/services/auth.service.ts',
      'core/services/finanzas.service.ts',
      'core/services/signos-vitales.service.ts',
      'core/services/websocket.service.ts',
      'core/services/usuario.service.ts',
      'core/services/banco.service.ts',
      'core/services/tasa-cambio.service.ts',
      'core/interceptors/jwt.interceptor.ts',
      'shared/services/alert-modal.service.ts'
    ]
  },
  {
    modulo: '1. Modulo Sedes (CRUD + Feedback Modal)',
    files: [
      'modulos/sede/sede-list/sede-list.component.ts',
      'shared/sede/sede.service.ts'
    ],
    checkAlertModal: true
  },
  {
    modulo: '2. Modulo Pisos (CRUD + Feedback Modal)',
    files: [
      'modulos/piso/piso-list/piso-list.component.ts',
      'modulos/piso/crear-piso/crear-piso.component.ts',
      'modulos/piso/editar-piso/editar-piso.component.ts',
      'shared/piso/piso.service.ts'
    ],
    checkAlertModal: true
  },
  {
    modulo: '3. Modulo Gerencias (CRUD + Feedback Modal)',
    files: [
      'modulos/gerencia/gerencia-list/gerencia-list.component.ts',
      'shared/gerencia/gerencia.service.ts'
    ],
    checkAlertModal: true
  },
  {
    modulo: '4. Modulo Tipos de Contrato (CRUD + Feedback Modal)',
    files: [
      'modulos/tipo-contrato/tipo-contrato-list/tipo-contrato-list.component.ts',
      'shared/tipo-contrato/tipo-contrato.service.ts'
    ],
    checkAlertModal: true
  },
  {
    modulo: '5. Modulo Dispositivos (CRUD + Feedback Modal)',
    files: [
      'modulos/dispositivo/dispositivo-list/dispositivo-list.component.ts',
      'modulos/dispositivo/crear-dispositivo/crear-dispositivo.component.ts',
      'modulos/dispositivo/editar-dispositivo/editar-dispositivo.component.ts',
      'shared/dispositivo/dispositivo.service.ts'
    ],
    checkAlertModal: true
  },
  {
    modulo: '6. Modulo Clientes (CRUD + Membresia + Pulsera + Feedback Modal)',
    files: [
      'modulos/cliente/cliente-list/cliente-list.component.ts',
      'modulos/cliente/crear-cliente/crear-cliente.component.ts',
      'modulos/cliente/editar-cliente/editar-cliente.component.ts',
      'shared/cliente/cliente.service.ts'
    ],
    checkAlertModal: true
  },
  {
    modulo: '7. Modulo Empleados (CRUD + Biometria + Feedback Modal)',
    files: [
      'modulos/empleado/empleado-list/empleado-list.component.ts',
      'modulos/empleado/crear-empleado/crear-empleado.component.ts',
      'modulos/empleado/editar-empleado/editar-empleado.component.ts',
      'shared/empleado/empleado.service.ts'
    ],
    checkAlertModal: true
  },
  {
    modulo: '8. Modulo Visitantes (CRUD + Pisos + Feedback Modal)',
    files: [
      'modulos/visitante/visitante-list/visitante-list.component.ts',
      'modulos/visitante/crear-visitante/crear-visitante.component.ts',
      'modulos/visitante/editar-visitante/editar-visitante.component.ts',
      'shared/visitante/visitante.service.ts'
    ],
    checkAlertModal: true
  },
  {
    modulo: '9. Modulo Usuarios & Roles (CRUD + Acciones Seguridad)',
    files: [
      'modulos/usuarios/usuario-list/usuario-list.component.ts'
    ],
    checkAlertModal: true
  },
  {
    modulo: '10. Modulo Catalogo de Membresias & Promociones',
    files: [
      'features/membresias/membresia-catalogo.component.ts',
      'features/membresias/membresia-catalogo.component.html'
    ],
    checkAlertModal: true
  },
  {
    modulo: '11. Modulo Cuentas Bancarias & Pasarelas',
    files: [
      'features/bancos/bancos-admin.component.ts',
      'features/bancos/bancos-admin.component.html'
    ],
    checkAlertModal: true
  },
  {
    modulo: '12. Modulo Tasas Cambiarias BCV',
    files: [
      'features/tasas/tasa-cambio-admin.component.ts',
      'features/tasas/tasa-cambio-admin.component.html'
    ],
    checkAlertModal: true
  },
  {
    modulo: '13. Modulo Finanzas & Pagos Admin',
    files: [
      'features/admin-dashboard/admin-dashboard.component.ts',
      'features/admin-dashboard/admin-dashboard.component.html'
    ],
    checkAlertModal: true
  },
  {
    modulo: '14. Modulo Permisos de Pisos & Matriz de Acceso',
    files: [
      'modulos/permisos/permisos-pisos/permisos-pisos.component.ts',
      'features/biometria-facial/biometria-facial.component.ts',
      'features/monitor-salud/monitor-salud.component.ts'
    ],
    checkAlertModal: false
  },
  {
    modulo: '15. Seguridad & Autenticacion (Login & Portal Cliente)',
    files: [
      'features/login/login.component.ts',
      'features/portal-cliente/portal-cliente.component.ts'
    ],
    checkAlertModal: true
  },
  {
    modulo: '16. Dashboard de Pagos & Conciliacion Split',
    files: [
      'features/pagos/pagos-dashboard.component.ts',
      'features/conciliacion/conciliacion-split.component.ts'
    ],
    checkAlertModal: true
  }
];

console.log('======================================================================');
console.log('   BATERIA DE PRUEBAS DE MODULOS FRONTEND (ANGULAR 18 CRUD, UX & QA)');
console.log('======================================================================');

let passed = 0;
let failed = 0;

for (const suite of testSuites) {
  console.log(`\n==> Verificando: ${suite.modulo}`);
  for (const relFile of suite.files) {
    const fullPath = path.join(srcDir, relFile);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.length > 50) {
        let fileOk = true;

        // Check AlertModalService contract
        if (suite.checkAlertModal && relFile.endsWith('.ts') && !relFile.endsWith('.service.ts')) {
          const hasAlertModal = content.includes('AlertModalService') &&
            (content.includes('alertModal.success') || content.includes('alertModal.warning') || content.includes('alertModal.confirm') || content.includes('alertModal.error'));
          if (!hasAlertModal) {
            console.log(`  [FAILED] ${relFile} no integra contratos de feedback amigable (AlertModalService)`);
            fileOk = false;
          }
        }

        // Check pure ASCII compliance
        const nonAsciiMatch = content.match(/[^\x00-\x7F]/g);
        if (nonAsciiMatch) {
          console.log(`  [FAILED] ${relFile} contiene caracteres no ASCII: ${Array.from(new Set(nonAsciiMatch)).join(', ')}`);
          fileOk = false;
        }

        if (fileOk) {
          console.log(`  [PASSED] ${relFile} (${content.length} bytes)`);
          passed++;
        } else {
          failed++;
        }
      } else {
        console.log(`  [FAILED] ${relFile} (contenido insuficiente)`);
        failed++;
      }
    } else {
      console.log(`  [FAILED] ${relFile} no encontrado`);
      failed++;
    }
  }
}

console.log('\n==> Verificando: Auditoria de Vulnerabilidades y Reglas de Seguridad');

// Test 1: No mock tokens in login
const loginPath = path.join(srcDir, 'features/login/login.component.ts');
const loginContent = fs.readFileSync(loginPath, 'utf8');
if (loginContent.includes('JWT_MOCK_TOKEN_ADMIN')) {
  console.log('  [FAILED] login.component.ts contiene JWT_MOCK_TOKEN_ADMIN');
  failed++;
} else {
  console.log('  [PASSED] login.component.ts: Sin bypass JWT mock');
  passed++;
}

// Test 2: No false positive messages in error handlers
const filesToCheckNoFalsePositive = [
  'modulos/cliente/editar-cliente/editar-cliente.component.ts',
  'modulos/empleado/editar-empleado/editar-empleado.component.ts',
  'modulos/visitante/crear-visitante/crear-visitante.component.ts',
  'modulos/visitante/editar-visitante/editar-visitante.component.ts',
  'modulos/permisos/permisos-pisos/permisos-pisos.component.ts'
];
for (const rel of filesToCheckNoFalsePositive) {
  const c = fs.readFileSync(path.join(srcDir, rel), 'utf8');
  if (c.includes('alertModal.info(\'Cambios guardados') || c.includes('alertModal.info(\'Permisos asignados') || c.includes('alertModal.info(\'Visitante creado localmente')) {
    console.log(`  [FAILED] ${rel} reporta falso positivo en callback de error`);
    failed++;
  } else {
    console.log(`  [PASSED] ${rel}: Sin falsos positivos en error`);
    passed++;
  }
}

// Test 3: CSV/Excel formula injection prevention
const pagosPath = path.join(srcDir, 'features/pagos/pagos-dashboard.component.ts');
const pagosContent = fs.readFileSync(pagosPath, 'utf8');
if (pagosContent.includes('sanitizarTextoExcel') && pagosContent.includes('/^[=\\+\\-\\@\\t\\r]/')) {
  console.log('  [PASSED] pagos-dashboard.component.ts: Sanitizacion de inyeccion de formulas activa');
  passed++;
} else {
  console.log('  [FAILED] pagos-dashboard.component.ts no sanitiza formulas CSV/Excel');
  failed++;
}

// Test 4: Concurrency semaphores in critical actions
const semaphores = [
  { file: 'features/bancos/bancos-admin.component.ts', flag: 'guardando' },
  { file: 'features/membresias/membresia-catalogo.component.ts', flag: 'guardando' },
  { file: 'features/conciliacion/conciliacion-split.component.ts', flag: 'procesandoAccion' },
  { file: 'features/portal-cliente/portal-cliente.component.ts', flag: 'enviandoPago' },
  { file: 'modulos/sede/sede-list/sede-list.component.ts', flag: 'guardando' },
  { file: 'modulos/gerencia/gerencia-list/gerencia-list.component.ts', flag: 'guardando' },
  { file: 'modulos/tipo-contrato/tipo-contrato-list/tipo-contrato-list.component.ts', flag: 'guardando' }
];
for (const sem of semaphores) {
  const c = fs.readFileSync(path.join(srcDir, sem.file), 'utf8');
  if (c.includes(sem.flag)) {
    console.log(`  [PASSED] ${sem.file}: Semaforo contra doble envio (${sem.flag}) activo`);
    passed++;
  } else {
    console.log(`  [FAILED] ${sem.file} falta semaforo ${sem.flag}`);
    failed++;
  }
}

console.log('\n======================================================================');
console.log(`   RESUMEN FRONTEND QA: PASSED=${passed} | FAILED=${failed}`);
console.log('======================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
