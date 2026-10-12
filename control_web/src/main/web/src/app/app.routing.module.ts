import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './features/login/login.component';
import { AdminDashboardComponent } from './features/admin-dashboard/admin-dashboard.component';
import { MonitorSaludComponent } from './features/monitor-salud/monitor-salud.component';
import { BiometriaFacialComponent } from './features/biometria-facial/biometria-facial.component';
import { PortalClienteComponent } from './features/portal-cliente/portal-cliente.component';

import { CrearClienteComponent } from './modulos/cliente/crear-cliente/crear-cliente.component';
import { EmpleadoDetailsComponent } from './modulos/empleado/empleado-details/empleado-details.component';
import { CrearEmpleadoComponent } from './modulos/empleado/crear-empleado/crear-empleado.component';
import { EditarEmpleadoComponent } from './modulos/empleado/editar-empleado/editar-empleado.component';
import { EmpleadoListComponent } from './modulos/empleado/empleado-list/empleado-list.component';

import { VisitanteDetailsComponent } from './modulos/visitante/visitante-details/visitante-details.component';
import { CrearVisitanteComponent } from './modulos/visitante/crear-visitante/crear-visitante.component';
import { EditarVisitanteComponent } from './modulos/visitante/editar-visitante/editar-visitante.component';
import { VisitanteListComponent } from './modulos/visitante/visitante-list/visitante-list.component';

import { DispositivoDetailsComponent } from './modulos/dispositivo/dispositivo-details/dispositivo-details.component';
import { CrearDispositivoComponent } from './modulos/dispositivo/crear-dispositivo/crear-dispositivo.component';
import { EditarDispositivoComponent } from './modulos/dispositivo/editar-dispositivo/editar-dispositivo.component';
import { DispositivoListComponent } from './modulos/dispositivo/dispositivo-list/dispositivo-list.component';

import { PisoDetailsComponent } from './modulos/piso/piso-details/piso-details.component';
import { CrearPisoComponent } from './modulos/piso/crear-piso/crear-piso.component';
import { EditarPisoComponent } from './modulos/piso/editar-piso/editar-piso.component';
import { PisoListComponent } from './modulos/piso/piso-list/piso-list.component';

import { ClienteListComponent } from './modulos/cliente/cliente-list/cliente-list.component';
import { ClienteDetailsComponent } from './modulos/cliente/cliente-details/cliente-details.component';
import { EditarClienteComponent } from './modulos/cliente/editar-cliente/editar-cliente.component';

import { SedeListComponent } from './modulos/sede/sede-list/sede-list.component';
import { GerenciaListComponent } from './modulos/gerencia/gerencia-list/gerencia-list.component';
import { TipoContratoListComponent } from './modulos/tipo-contrato/tipo-contrato-list/tipo-contrato-list.component';
import { PermisosPisosComponent } from './modulos/permisos/permisos-pisos/permisos-pisos.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', pathMatch: 'full', redirectTo: 'home/admin-dashboard' },
  {
    path: 'home',
    component: HomeComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'admin-dashboard' },
      { path: 'admin-dashboard', component: AdminDashboardComponent },
      { path: 'monitor-salud', component: MonitorSaludComponent },
      { path: 'biometria-facial', component: BiometriaFacialComponent },
      { path: 'portal-cliente', component: PortalClienteComponent },
      { path: 'clientes', component: ClienteListComponent },
      { path: 'cliente-add', component: CrearClienteComponent },
      { path: 'cliente/:id', component: ClienteDetailsComponent },
      { path: 'cliente-edit/:id', component: EditarClienteComponent },
      { path: 'empleados', component: EmpleadoListComponent },
      { path: 'empleado-add', component: CrearEmpleadoComponent },
      { path: 'empleado/:id', component: EmpleadoDetailsComponent },
      { path: 'empleado-edit/:id', component: EditarEmpleadoComponent },
      { path: 'visitantes', component: VisitanteListComponent },
      { path: 'visitante-add', component: CrearVisitanteComponent },
      { path: 'visitante/:id', component: VisitanteDetailsComponent },
      { path: 'visitante-edit/:id', component: EditarVisitanteComponent },
      { path: 'dispositivos', component: DispositivoListComponent },
      { path: 'dispositivo-add', component: CrearDispositivoComponent },
      { path: 'dispositivo/:id', component: DispositivoDetailsComponent },
      { path: 'dispositivo-edit/:id', component: EditarDispositivoComponent },
      { path: 'pisos', component: PisoListComponent },
      { path: 'piso-add', component: CrearPisoComponent },
      { path: 'piso/:id', component: PisoDetailsComponent },
      { path: 'piso-edit/:id', component: EditarPisoComponent },
      { path: 'sedes', component: SedeListComponent },
      { path: 'gerencias', component: GerenciaListComponent },
      { path: 'tipo-contratos', component: TipoContratoListComponent },
      { path: 'permisos-pisos', component: PermisosPisosComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
