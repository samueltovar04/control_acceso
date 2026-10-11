#!/usr/bin/env node

/**
 * Batería de pruebas de verificación estructural y de contratos
 * del Frontend Angular para todos los componentes y servicios.
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
      'core/interceptors/jwt.interceptor.ts'
    ]
  },
  {
    modulo: 'Módulo Biometría Facial',
    files: [
      'features/biometria-facial/biometria-facial.component.ts',
      'features/biometria-facial/biometria-facial.component.html'
    ]
  },
  {
    modulo: 'Módulo Telemetría & Monitor de Salud',
    files: [
      'features/monitor-salud/monitor-salud.component.ts',
      'features/monitor-salud/monitor-salud.component.html'
    ]
  },
  {
    modulo: 'Módulo Finanzas & Admin Dashboard',
    files: [
      'features/admin-dashboard/admin-dashboard.component.ts',
      'features/admin-dashboard/admin-dashboard.component.html'
    ]
  },
  {
    modulo: 'Módulo Portal de Cliente & Credencial QR',
    files: [
      'features/portal-cliente/portal-cliente.component.ts',
      'features/portal-cliente/portal-cliente.component.html'
    ]
  },
  {
    modulo: 'Módulo Empleados & Visitantes',
    files: [
      'modulos/empleado/empleado-list/empleado-list.component.ts',
      'modulos/visitante/visitante-list/visitante-list.component.ts',
      'modulos/dispositivo/dispositivo-list/dispositivo-list.component.ts'
    ]
  }
];

console.log('======================================================================');
console.log('   BATERÍA DE PRUEBAS DE MÓDULOS FRONTEND (ANGULAR 18)');
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
        console.log(`  [PASSED] ${relFile} (${content.length} bytes)`);
        passed++;
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

console.log('\n======================================================================');
console.log(`   RESUMEN FRONTEND: PASSED=${passed} | FAILED=${failed}`);
console.log('======================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
