import { Observable, Subject, Subscription} from "rxjs";
import { Router, ActivatedRoute } from '@angular/router';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { PisoService } from '../../../shared/piso/piso.service';
import { Piso } from "../../../shared/piso/piso.model";

import { SedeService, Sede } from '../../../shared/sede/sede.service';

@Component({
  selector: 'app-editar-piso',
  templateUrl: './editar-piso.component.html',
  styleUrls: ['./editar-piso.component.css']
})
export class EditarPisoComponent implements OnInit {

  piso: Piso;
  sedesList: Sede[] = [];
  id: number;
  submitted = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pisoService: PisoService,
    private sedeService: SedeService
  ) { }

  ngOnInit() {
    this.submitted = false;
    this.piso = new Piso();
    this.id = this.route.snapshot.params['id'];

    this.sedeService.getListSedes().subscribe(
      data => this.sedesList = data,
      err => console.error('Error cargando sedes', err)
    );

    this.pisoService.getPiso(this.id)
      .subscribe(data => {
        this.piso = data;
        if (this.piso.sede && this.piso.sede.id) {
          this.piso.sede_id = this.piso.sede.id;
          this.piso.sedeId = this.piso.sede.id;
        }
      }, error => console.error(error));
  }

  save() {
    if (this.piso.sede_id) {
      this.piso.sedeId = this.piso.sede_id;
    }
    this.pisoService.updatePiso(this.id, this.piso)
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
