import { Component, OnDestroy, OnInit } from '@angular/core';
import { VisitanteService } from '../../../shared/visitante/visitante.service';
import { Visitante } from "../../../shared/visitante/visitante.model";
import { Observable,Subject } from "rxjs";
import * as $ from 'jquery';
import 'datatables.net';
import 'datatables.net-bs4';
@Component({
  selector: 'app-visitante-list',
  templateUrl: './visitante-list.component.html',
  styleUrls: ['./visitante-list.component.css']
})
export class VisitanteListComponent implements OnInit, OnDestroy {

    visita$: Observable<Visitante>;
    dataTable: any;
    public rowsOnPage = 10;
    public sortBy = "name";
    public sortOrder = "asc";

    dtOptions: DataTables.Settings = {};
    dtTrigger: Subject<any> = new Subject();
    constructor(private visiService: VisitanteService) { }

   /* ngOnInit() {
      this.visiService.getAll().subscribe(data => {
        this.visita = data;
      });
    }*/

    ngOnInit() {
      const table: any = $('tablaVis');
    this.dataTable = table.DataTable();
      this.dtOptions = {
      pagingType: 'full_numbers',
      pageLength: 5,
      processing: true
    };
        this.reloadData();
    }

  reloadData() {
    this.visiService.getVisitantesList().subscribe(data => {
        console.log(data);
        this.visita$ = data;
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
  deleteVisitante(id: number) {
    this.visiService.deleteVisitante(id)
      .subscribe(
        data => {
          console.log(data);
          this.reloadData();
        },
        error => console.log(error));
  }

}
