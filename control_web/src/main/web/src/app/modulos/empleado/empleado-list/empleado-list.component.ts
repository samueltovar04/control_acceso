import { Component, OnDestroy, OnInit } from '@angular/core';
import { EmpleadoService } from '../../../shared/empleado/empleado.service';
import { Empleado } from "../../../shared/empleado/empleado.model";
import { Observable, Subject } from "rxjs";

@Component({
  selector: 'app-empleado-list',
  templateUrl: './empleado-list.component.html',
  styleUrls: ['./empleado-list.component.css']
})
export class EmpleadoListComponent implements OnInit, OnDestroy {
  empleados$: Observable<Empleado> | any;
  dtOptions: any = {};
  dtTrigger: Subject<any> = new Subject<any>();

  constructor(private empleService: EmpleadoService) { }

  ngOnInit() {
    this.dtOptions = {
      pagingType: 'full_numbers',
      pageLength: 5,
      processing: true
    };
    this.reloadData();
  }

  reloadData() {
    this.empleService.getEmployeesList().subscribe(data => {
      this.empleados$ = data;
      this.dtTrigger.next(data);
    });
  }

  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();
  }

  deleteEmployee(id: number) {
    this.empleService.deleteEmployee(id).subscribe({
      next: () => this.reloadData(),
      error: err => console.log(err)
    });
  }
}
