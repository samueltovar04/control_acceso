import { Observable, Subject} from "rxjs";
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { DispositivoService } from '../../../shared/dispositivo/dispositivo.service';
import { Dispositivo } from "../../../shared/dispositivo/dispositivo.model";

@Component({
  selector: 'app-crear-dispositivo',
  templateUrl: './crear-dispositivo.component.html',
  styleUrls: ['./crear-dispositivo.component.css']
})

export class CrearDispositivoComponent implements OnInit {

dispositivo: Dispositivo = new Dispositivo();

submitted = false;

constructor(private dispositivoService: DispositivoService,private router: Router) { }

 ngOnInit() {
    }
  newDispositivo(): void {
    this.submitted = false;
    this.dispositivo = new Dispositivo();
  }

  save() {
    console.log(this.dispositivo);
    this.dispositivoService.createDispositivo(this.dispositivo)
      .subscribe(data => console.log(data), error => console.log(error));
    this.dispositivo = new Dispositivo();
    this.gotoList();
  }

  onSubmit() {
    this.submitted = true;
    this.save();
  }

  gotoList() {
    this.router.navigate(['/home/dispositivos']);
  }
}
