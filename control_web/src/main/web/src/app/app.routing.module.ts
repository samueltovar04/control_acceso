import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './components/home/home.component';
//import { LoginComponent } from './components/login/login.component';
//import { EstatusBoxComponent } from './components/estatus-box/estatus-box.component';
/*
* Empleado
*/
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

const routes: Routes = [
{ path: '', pathMatch: 'full', redirectTo: 'home' },
{path: 'home', component: HomeComponent ,
    children: [
  {path: 'empleados', component: EmpleadoListComponent},
  {path: 'empleado-add', component: CrearEmpleadoComponent},
  {path: 'empleado/:id', component: EmpleadoDetailsComponent},
  {path: 'empleado-edit/:id',component: EditarEmpleadoComponent },
  {path: 'visitantes', component: VisitanteListComponent},
  {path: 'visitante-add', component: CrearVisitanteComponent},
  {path: 'visitante/:id', component: VisitanteDetailsComponent},
  {path: 'visitante-edit/:id',component: EditarVisitanteComponent},
  {path: 'dispositivos', component: DispositivoListComponent},
  {path: 'dispositivo-add', component: CrearDispositivoComponent},
  {path: 'dispositivo/:id', component: DispositivoDetailsComponent},
  {path: 'dispositivo-edit/:id',component: EditarDispositivoComponent},
  {path: 'pisos', component: PisoListComponent},
  {path: 'piso-add', component: CrearPisoComponent},
  {path: 'piso/:id', component: PisoDetailsComponent},
  {path: 'piso-edit/:id',component: EditarPisoComponent}
  ]
}
];
@NgModule({
imports: [RouterModule.forRoot(routes,{ useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
