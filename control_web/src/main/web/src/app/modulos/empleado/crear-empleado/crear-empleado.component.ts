import {WebcamImage, WebcamInitError, WebcamUtil} from 'ngx-webcam';
import { Observable, Subject} from "rxjs";
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { EmpleadoService } from '../../../shared/empleado/empleado.service';
import { Empleado } from "../../../shared/empleado/empleado.model";

@Component({
  selector: 'app-crear-empleado',
  templateUrl: './crear-empleado.component.html',
  styleUrls: ['./crear-empleado.component.css']
})

export class CrearEmpleadoComponent implements OnInit {

id: number;
employee: Empleado = new Empleado();
pisos$: Subject<any> = new Subject();
submitted = false;

constructor(private empleService: EmpleadoService,private router: Router) { }

 public webcamImage: WebcamImage = null;

  handleImage(webcamImage: WebcamImage) {
    this.webcamImage = webcamImage;
    this.employee.picture = this.webcamImage.imageAsDataUrl;
    //console.log(this.employee.picture)
  }
 ngOnInit() {
    }
  newEmployee(): void {
    this.submitted = false;
    this.employee = new Empleado();
  }

  save() {
    console.log(this.employee);
    this.empleService.createEmployee(this.employee)
      .subscribe(data =>
      {console.log(data)
      this.id = data.id;
      this.employee = data;
      //this.pisos$ =
      }, error => console.log(error));
    this.gotoList();
  }

  onSubmit() {
    this.submitted = true;
    this.save();
  }

  gotoList() {
    this.router.navigate(['/home/empleado/',this.id]);
  }
}
