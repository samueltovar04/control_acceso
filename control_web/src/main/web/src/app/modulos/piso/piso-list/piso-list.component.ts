import { Component, OnDestroy, OnInit } from '@angular/core';
import { PisoService } from '../../../shared/piso/piso.service';
import { Piso } from "../../../shared/piso/piso.model";
import { Observable,Subject } from "rxjs";
import * as $ from 'jquery';
import 'datatables.net';
import 'datatables.net-bs4';
@Component({
  selector: 'app-piso-list',
  templateUrl: './piso-list.component.html',
  styleUrls: ['./piso-list.component.css']
})
export class PisoListComponent implements OnInit, OnDestroy {

    piso$: Observable<Piso>;
    dataTable: any;
    public rowsOnPage = 10;
    public sortBy = "name";
    public sortOrder = "asc";

    dtOptions: DataTables.Settings = {};
    dtTrigger: Subject<any> = new Subject();
    constructor(private pisoService: PisoService) { }

   /* ngOnInit() {
      this.pisoService.getAll().subscribe(data => {
        this.piso = data;
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
    this.pisoService.getPisosList().subscribe(data => {
        console.log(data);
        this.piso$ = data;
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
  deletePiso(id: number) {
    this.pisoService.deletePiso(id)
      .subscribe(
        data => {
          console.log(data);
          this.reloadData();
        },
        error => console.log(error));
  }

}
