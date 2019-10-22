import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Empleado } from '../../../shared/empleado/empleado.model';
import { EmpleadoService } from '../../../shared/empleado/empleado.service';
import { EmpleadoListComponent } from '../empleado-list/empleado-list.component';
@Component({
  selector: 'app-empleado-details',
  templateUrl: './empleado-details.component.html',
  styleUrls: ['./empleado-details.component.css']
})

export class EmpleadoDetailsComponent implements OnInit {

id: number;
employee: Empleado;

constructor(private route: ActivatedRoute,private router: Router,private empleService: EmpleadoService,
 private listComponent: EmpleadoListComponent) { }

  ngOnInit() {
    this.employee = new Empleado();

    this.id = this.route.snapshot.params['id'];

    this.empleService.getEmployee(this.id)
      .subscribe(data => {
        console.log(data)
        this.employee = data;
      }, error => console.log(error));
  }

  list(){
    this.router.navigate(['/home/empleados']);
  }

}
