import {WebcamImage, WebcamInitError, WebcamUtil} from 'ngx-webcam';
import { Observable, Subject} from "rxjs";
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { VisitanteService } from '../../../shared/visitante/visitante.service';
import { Visitante } from "../../../shared/visitante/visitante.model";
import { EmpleadoService } from '../../../shared/empleado/empleado.service';

@Component({
  selector: 'app-crear-visitante',
  templateUrl: './crear-visitante.component.html',
  styleUrls: ['./crear-visitante.component.css']
})

export class CrearVisitanteComponent implements OnInit {

visita: any = new Visitante();
empleadosList: any[] = [];

submitted = false;

constructor(
  private visiService: VisitanteService,
  private empleService: EmpleadoService,
  private router: Router
) { }

 public webcamImage: WebcamImage = null;

  handleImage(webcamImage: WebcamImage) {
    this.webcamImage = webcamImage;
    this.visita.picture = this.webcamImage.imageAsDataUrl;
  }
 ngOnInit() {
   this.empleService.getEmployeesList().subscribe({
     next: (data) => (this.empleadosList = data || []),
     error: (err) => console.log('Error empleados:', err)
   });
 }
  newVisitante(): void {
    this.submitted = false;
    this.visita = new Visitante();
  }

  save() {
    console.log(this.visita);
    this.visiService.createVisitante(this.visita)
      .subscribe(data => console.log(data), error => console.log(error));
    this.visita = new Visitante();
    this.gotoList();
  }

  onSubmit() {
    this.submitted = true;
    this.save();
  }

  gotoList() {
    this.router.navigate(['/visitantes']);
  }
}
