import { Component, OnDestroy, OnInit } from '@angular/core';
import { VisitanteService } from '../../../shared/visitante/visitante.service';
import { Visitante } from "../../../shared/visitante/visitante.model";
import { Observable, Subject } from "rxjs";

@Component({
  selector: 'app-visitante-list',
  templateUrl: './visitante-list.component.html',
  styleUrls: ['./visitante-list.component.css']
})
export class VisitanteListComponent implements OnInit, OnDestroy {
  visita$: Observable<Visitante> | any;
  dtOptions: any = {};
  dtTrigger: Subject<any> = new Subject<any>();

  constructor(private visiService: VisitanteService) { }

  ngOnInit() {
    this.dtOptions = {
      pagingType: 'full_numbers',
      pageLength: 5,
      processing: true
    };
    this.reloadData();
  }

  reloadData() {
    this.visiService.getVisitantesList().subscribe(data => {
      this.visita$ = data;
      this.dtTrigger.next(data);
    });
  }

  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();
  }

  deleteVisitante(id: number) {
    this.visiService.deleteVisitante(id).subscribe({
      next: () => this.reloadData(),
      error: err => console.log(err)
    });
  }
}
