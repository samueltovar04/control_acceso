import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { MatButtonModule,  MatIconModule,MatSidenavModule, MatCardModule, MatInputModule, MatListModule, MatToolbarModule } from '@angular/material';
import { CommonModule} from '@angular/common';
//import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
//import { NgSelectModule } from '@ng-select/ng-select';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app.routing.module';

//import { NavbarComponent } from './components/navbar/navbar.component';
import { LeftMenuComponent } from './components/left-menu/left-menu.component';
//import { FiltersComponent } from './components/filters/filters.component';
//import { DropdownNtfComponent } from './components/navbar/dropdown-ntf/dropdown-ntf.component';
//import { DropdownAppsComponent } from './components/navbar/dropdown-apps/dropdown-apps.component';
import { HomeComponent } from './components/home/home.component';
//import { LoginComponent } from './components/login/login.component';
//import { EstatusBoxComponent } from './components/estatus-box/estatus-box.component';
//import { NavTabsComponent } from './components/nav-tabs/nav-tabs.component';

import { EmpleadoService } from './shared/empleado/empleado.service';
import { EmpleadoDetailsComponent } from './modulos/empleado/empleado-details/empleado-details.component';
import { CrearEmpleadoComponent } from './modulos/empleado/crear-empleado/crear-empleado.component';
import { EditarEmpleadoComponent } from './modulos/empleado/editar-empleado/editar-empleado.component';
import { EmpleadoListComponent } from './modulos/empleado/empleado-list/empleado-list.component';

import { PisoService } from './shared/piso/piso.service';
import { PisoDetailsComponent } from './modulos/piso/piso-details/piso-details.component';
import { CrearPisoComponent } from './modulos/piso/crear-piso/crear-piso.component';
import { EditarPisoComponent } from './modulos/piso/editar-piso/editar-piso.component';
import { PisoListComponent } from './modulos/piso/piso-list/piso-list.component';

import { DispositivoService } from './shared/dispositivo/dispositivo.service';
import { DispositivoDetailsComponent } from './modulos/dispositivo/dispositivo-details/dispositivo-details.component';
import { CrearDispositivoComponent } from './modulos/dispositivo/crear-dispositivo/crear-dispositivo.component';
import { EditarDispositivoComponent } from './modulos/dispositivo/editar-dispositivo/editar-dispositivo.component';
import { DispositivoListComponent } from './modulos/dispositivo/dispositivo-list/dispositivo-list.component';

import { VisitanteService } from './shared/visitante/visitante.service';
import { VisitanteDetailsComponent } from './modulos/visitante/visitante-details/visitante-details.component';
import { CrearVisitanteComponent } from './modulos/visitante/crear-visitante/crear-visitante.component';
import { EditarVisitanteComponent } from './modulos/visitante/editar-visitante/editar-visitante.component';
import { VisitanteListComponent } from './modulos/visitante/visitante-list/visitante-list.component';

import { CameraComponent } from './camera/camera.component';

import { DataTablesModule } from 'angular-datatables';
import { WebcamModule } from 'ngx-webcam';

@NgModule({
  declarations: [
    AppComponent,
    CameraComponent,
    LeftMenuComponent,
    HomeComponent,
    EmpleadoListComponent,
    CrearEmpleadoComponent,
    EditarEmpleadoComponent,
    EmpleadoDetailsComponent,
    VisitanteListComponent,
    CrearVisitanteComponent,
    EditarVisitanteComponent,
    VisitanteDetailsComponent,
    DispositivoListComponent,
    CrearDispositivoComponent,
    EditarDispositivoComponent,
    DispositivoDetailsComponent,
    PisoListComponent,
    CrearPisoComponent,
    EditarPisoComponent,
    PisoDetailsComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    WebcamModule,
    RouterModule,
    AppRoutingModule,
    ReactiveFormsModule,
    DataTablesModule,
    FormsModule,
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatSidenavModule,
    MatInputModule,
    MatListModule,
    MatToolbarModule
  ],
  providers: [EmpleadoService,PisoService,VisitanteService,DispositivoService],
  bootstrap: [AppComponent]
})
export class AppModule { }
