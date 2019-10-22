import { Observable, Subject, Subscription} from "rxjs";
import { Router, ActivatedRoute } from '@angular/router';
import { Component, OnDestroy, OnInit } from '@angular/core';

import { DispositivoService } from '../../../shared/dispositivo/dispositivo.service';
import { Dispositivo } from "../../../shared/dispositivo/dispositivo.model";

@Component({
  selector: 'app-editar-dispositivo',
  templateUrl: './editar-dispositivo.component.html',
  styleUrls: ['./editar-dispositivo.component.css']
})

export class EditarDispositivoComponent implements OnInit {

dispositivo: Dispositivo;

id: number;
submitted = false;

constructor(private route: ActivatedRoute,private router: Router,private dispositivoService: DispositivoService) { }

 sub: Subscription;

 ngOnInit() {
   this.submitted = false;
   this.dispositivo = new Dispositivo();
   this.id = this.route.snapshot.params['id'];

    this.dispositivoService.getDispositivo(this.id)
      .subscribe(data => {
        console.log(data)
        this.dispositivo = data;
      }, error => console.log(error));

  }
  newEmployee(): void {
    this.submitted = false;
    this.dispositivo = new Dispositivo();
  }

  save() {
    console.log(this.dispositivo);
    this.dispositivoService.updateDispositivo(this.id,this.dispositivo)
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
