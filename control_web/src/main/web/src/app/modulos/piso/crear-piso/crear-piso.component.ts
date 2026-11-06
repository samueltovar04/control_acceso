import { Observable, Subject } from "rxjs";
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { PisoService } from '../../../shared/piso/piso.service';
import { Piso } from "../../../shared/piso/piso.model";
import { SedeService, Sede } from '../../../shared/sede/sede.service';
import { AlertModalService } from '../../../shared/services/alert-modal.service';

@Component({
  selector: 'app-crear-piso',
  templateUrl: './crear-piso.component.html',
  styleUrls: ['./crear-piso.component.css']
})
export class CrearPisoComponent implements OnInit {

  piso: Piso = new Piso();
  sedesList: Sede[] = [];
  submitted = false;

  constructor(
    private pisoService: PisoService,
    private sedeService: SedeService,
    private alertModal: AlertModalService,
    private router: Router
  ) { }

  ngOnInit() {
    this.sedeService.getListSedes().subscribe(
      data => this.sedesList = data,
      err => console.error('Error cargando sedes', err)
    );
  }

  newPiso(): void {
    this.submitted = false;
    this.piso = new Piso();
  }

  save() {
    if (this.piso.sede_id) {
      this.piso.sedeId = this.piso.sede_id;
    }
    this.pisoService.createPiso(this.piso)
      .subscribe({
        next: () => {
          this.alertModal.success('Piso creado exitosamente.', 'Registro Exitoso');
          this.gotoList();
        },
        error: (error) => {
          console.error(error);
          this.alertModal.error('No se pudo crear el piso. Verifique los datos ingresados.', 'Error al Crear');
        }
      });
  }

  onSubmit() {
    this.submitted = true;
    if (!this.piso.piso || !this.piso.piso.trim()) {
      this.alertModal.warning('Por favor ingrese el numero o nombre del piso.', 'Campo Requerido');
      return;
    }
    if (!this.piso.descripcion || !this.piso.descripcion.trim()) {
      this.alertModal.warning('Por favor ingrese la descripcion del piso.', 'Campo Requerido');
      return;
    }
    this.save();
  }

  gotoList() {
    this.router.navigate(['/home/pisos']);
  }
}
