import { Observable, Subject} from "rxjs";
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { PisoService } from '../../../shared/piso/piso.service';
import { Piso } from "../../../shared/piso/piso.model";

@Component({
  selector: 'app-crear-piso',
  templateUrl: './crear-piso.component.html',
  styleUrls: ['./crear-piso.component.css']
})

export class CrearPisoComponent implements OnInit {

piso: Piso = new Piso();


submitted = false;

constructor(private pisoService: PisoService,private router: Router) { }

 ngOnInit() {
    }
  newPiso(): void {
    this.submitted = false;
    this.piso = new Piso();
  }

  save() {
    console.log(this.piso);
    this.pisoService.createPiso(this.piso)
      .subscribe(data => console.log(data), error => console.log(error));
    this.piso = new Piso();
    this.gotoList();
  }

  onSubmit() {
    this.submitted = true;
    this.save();
  }

  gotoList() {
    this.router.navigate(['/pisos']);
  }
}
