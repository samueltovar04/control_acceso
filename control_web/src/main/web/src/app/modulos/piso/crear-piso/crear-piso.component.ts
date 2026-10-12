import { Observable, Subject} from "rxjs";
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { PisoService } from '../../../shared/piso/piso.service';
import { Piso } from "../../../shared/piso/piso.model";

import { SedeService, Sede } from '../../../shared/sede/sede.service';

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
      .subscribe(data => {
        this.gotoList();
      }, error => console.error(error));
  }

  onSubmit() {
    this.submitted = true;
    this.save();
  }

  gotoList() {
    this.router.navigate(['/home/pisos']);
  }
}
