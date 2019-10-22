import { Observable, Subject, Subscription} from "rxjs";
import { Router, ActivatedRoute } from '@angular/router';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { PisoService } from '../../../shared/piso/piso.service';
import { Piso } from "../../../shared/piso/piso.model";

@Component({
  selector: 'app-editar-piso',
  templateUrl: './editar-piso.component.html',
  styleUrls: ['./editar-piso.component.css']
})

export class EditarPisoComponent implements OnInit {

piso: Piso;

id: number;
submitted = false;

constructor(private route: ActivatedRoute,private router: Router,private pisoService: PisoService) { }

 ngOnInit() {
   this.submitted = false;
   this.piso = new Piso();
   this.id = this.route.snapshot.params['id'];

    this.pisoService.getPiso(this.id)
      .subscribe(data => {
        console.log(data)
        this.piso = data;
      }, error => console.log(error));

  }
  newEmployee(): void {
    this.submitted = false;
    this.piso = new Piso();
  }

  save() {
    console.log(this.piso);
    this.pisoService.updatePiso(this.id,this.piso)
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
