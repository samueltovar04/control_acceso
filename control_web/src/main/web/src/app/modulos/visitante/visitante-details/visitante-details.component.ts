import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Visitante } from '../../../shared/visitante/visitante.model';
import { VisitanteService } from '../../../shared/visitante/visitante.service';
import { VisitanteListComponent } from '../visitante-list/visitante-list.component';
@Component({
  selector: 'app-visitante-details',
  templateUrl: './visitante-details.component.html',
  styleUrls: ['./visitante-details.component.css']
})

export class VisitanteDetailsComponent implements OnInit {

id: number;
visita: Visitante;

constructor(private route: ActivatedRoute,private router: Router,private visiService: VisitanteService,
 private listComponent: VisitanteListComponent) { }

  ngOnInit() {
    this.visita = new Visitante();

    this.id = this.route.snapshot.params['id'];

    this.visiService.getVisitante(this.id)
      .subscribe(data => {
        console.log(data)
        this.visita = data;
      }, error => console.log(error));
  }

  list(){
    this.router.navigate(['visitantes']);
  }

}
