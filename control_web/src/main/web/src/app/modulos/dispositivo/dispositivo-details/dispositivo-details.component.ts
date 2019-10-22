import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Dispositivo } from '../../../shared/dispositivo/dispositivo.model';
import { DispositivoService } from '../../../shared/dispositivo/dispositivo.service';
import { DispositivoListComponent } from '../dispositivo-list/dispositivo-list.component';
@Component({
  selector: 'app-dispositivo-details',
  templateUrl: './dispositivo-details.component.html',
  styleUrls: ['./dispositivo-details.component.css']
})

export class DispositivoDetailsComponent implements OnInit {

id: number;
dispositivo: Dispositivo;

constructor(private route: ActivatedRoute,private router: Router,private dispositivoService: DispositivoService,
 private listComponent: DispositivoListComponent) { }

  ngOnInit() {
    this.dispositivo = new Dispositivo();

    this.id = this.route.snapshot.params['id'];

    this.dispositivoService.getDispositivo(this.id)
      .subscribe(data => {
        console.log(data)
        this.dispositivo = data;
      }, error => console.log(error));
  }

  list(){
    this.router.navigate(['/home/dispositivos']);
  }

}
