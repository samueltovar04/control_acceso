import { Component, OnDestroy, OnInit } from '@angular/core';
import { EmpleadoService } from '../../../shared/empleado/empleado.service';
import { Empleado } from "../../../shared/empleado/empleado.model";
import { Observable,Subject } from "rxjs";
import * as $ from 'jquery';
import 'datatables.net';
import 'datatables.net-bs4';
@Component({
  selector: 'app-empleado-list',
  templateUrl: './empleado-list.component.html',
  styleUrls: ['./empleado-list.component.css']
})
export class EmpleadoListComponent implements OnInit, OnDestroy {

    empleados$: Observable<Empleado>;
    dataTable: any;
    public rowsOnPage = 10;
    public sortBy = "name";
    public sortOrder = "asc";

    dtOptions: DataTables.Settings = {};
    dtTrigger: Subject<any> = new Subject();
    constructor(private empleService: EmpleadoService) { }

   /* ngOnInit() {
      this.empleService.getAll().subscribe(data => {
        this.empleados = data;
      });
    }*/

    ngOnInit() {
      const table: any = $('tablaEmp');
    this.dataTable = table.DataTable();
      this.dtOptions = {
      pagingType: 'full_numbers',
      pageLength: 5,
      processing: true
    };
        this.reloadData();
    }

  reloadData() {
    this.empleService.getEmployeesList().subscribe(data => {
        console.log(data);
        this.empleados$ = data;
        this.dtTrigger.next();
      });
  }
  public toInt(num: string) {
        return +num;
    }

  public sortByWordLength = (a: any) => {
    return a.name.length;
  }

  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();
  }
  deleteEmployee(id: number) {
    this.empleService.deleteEmployee(id)
      .subscribe(
        data => {
          console.log(data);
          this.reloadData();
        },
        error => console.log(error));
  }

}
