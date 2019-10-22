import {WebcamImage, WebcamInitError, WebcamUtil} from 'ngx-webcam';
import { Observable, Subject, Subscription} from "rxjs";
import { Router, ActivatedRoute } from '@angular/router';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { EmpleadoService } from '../../../shared/empleado/empleado.service';
import { Empleado } from "../../../shared/empleado/empleado.model";

@Component({
  selector: 'app-editar-empleado',
  templateUrl: './editar-empleado.component.html',
  styleUrls: ['./editar-empleado.component.css']
})

export class EditarEmpleadoComponent implements OnInit {

employee: Empleado;
srcData : SafeResourceUrl;
id: number;
submitted = false;

constructor(private sanitizer: DomSanitizer, private route: ActivatedRoute,private router: Router,private empleService: EmpleadoService) { }

 public webcamImage: WebcamImage = null;
 sub: Subscription;

  handleImage(webcamImage: WebcamImage) {
    this.webcamImage = webcamImage;
    this.employee.picture = this.webcamImage.imageAsDataUrl;
    console.log("foto");
    console.log(this.employee.picture)
  }
 ngOnInit() {
   this.submitted = false;
   this.employee = new Empleado();
   this.id = this.route.snapshot.params['id'];

    this.empleService.getEmployee(this.id)
      .subscribe(data => {
        console.log(data)
        this.employee = data;
        this.srcData = this.sanitizer.bypassSecurityTrustResourceUrl(data.picture);

      }, error => console.log(error));

  }
  newEmployee(): void {
    this.submitted = false;
    this.employee = new Empleado();
  }

  save() {
    console.log(this.employee);
    this.empleService.updateEmployee(this.id,this.employee)
      .subscribe(data => console.log(data), error => console.log(error));
    this.employee = new Empleado();
    this.gotoList();
  }

  onSubmit() {
    this.submitted = true;
    this.save();
  }

  gotoList() {
    this.router.navigate(['/home/empleados']);
  }
}
