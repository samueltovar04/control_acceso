import {WebcamImage, WebcamInitError, WebcamUtil} from 'ngx-webcam';
import { Observable, Subject, Subscription} from "rxjs";
import { Router, ActivatedRoute } from '@angular/router';
import { Component, OnDestroy, OnInit } from '@angular/core';

import { VisitanteService } from '../../../shared/visitante/visitante.service';
import { Visitante } from "../../../shared/visitante/visitante.model";

@Component({
  selector: 'app-editar-visitante',
  templateUrl: './editar-visitante.component.html',
  styleUrls: ['./editar-visitante.component.css']
})

export class EditarVisitanteComponent implements OnInit {

visita: Visitante;

id: number;
submitted = false;

constructor(private route: ActivatedRoute,private router: Router,private visiService: VisitanteService) { }

 public webcamImage: WebcamImage = null;
 sub: Subscription;

  handleImage(webcamImage: WebcamImage) {
    this.webcamImage = webcamImage;
    this.visita.picture = this.webcamImage.imageAsDataUrl;
    //console.log(this.visita.picture)
  }
 ngOnInit() {
   this.submitted = false;
   this.visita = new Visitante();
   this.id = this.route.snapshot.params['id'];

    this.visiService.getVisitante(this.id)
      .subscribe(data => {
        console.log(data)
        this.visita = data;
      }, error => console.log(error));

  }
  newEmployee(): void {
    this.submitted = false;
    this.visita = new Visitante();
  }

  save() {
    console.log(this.visita);
    this.visiService.updateVisitante(this.id,this.visita)
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
