import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Piso } from '../../../shared/piso/piso.model';
import { PisoService } from '../../../shared/piso/piso.service';
import { PisoListComponent } from '../piso-list/piso-list.component';
@Component({
  selector: 'app-piso-details',
  templateUrl: './piso-details.component.html',
  styleUrls: ['./piso-details.component.css']
})

export class PisoDetailsComponent implements OnInit {

id: number;
piso: Piso;

constructor(private route: ActivatedRoute,private router: Router,private pisoService: PisoService,
 private listComponent: PisoListComponent) { }

  ngOnInit() {
    this.piso = new Piso();

    this.id = this.route.snapshot.params['id'];

    this.pisoService.getPiso(this.id)
      .subscribe(data => {
        console.log(data)
        this.piso = data;
      }, error => console.log(error));
  }

  list(){
    this.router.navigate(['pisos']);
  }

}
