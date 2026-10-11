import { Component, OnInit, OnDestroy } from '@angular/core';
import { DispositivoService } from '../../../shared/dispositivo/dispositivo.service';
import { Dispositivo } from "../../../shared/dispositivo/dispositivo.model";
import { Observable, Subject } from "rxjs";

@Component({
  selector: 'app-dispositivo-list',
  templateUrl: './dispositivo-list.component.html',
  styleUrls: ['./dispositivo-list.component.css']
})
export class DispositivoListComponent implements OnInit, OnDestroy {
  public counts: any;
  dispositivo$: Observable<Dispositivo> | any;
  dtOptions: any = {};
  dtTrigger: Subject<any> = new Subject<any>();

  constructor(private dispositivoService: DispositivoService) {}

  ngOnInit() {
    this.dtOptions = {
      pagingType: 'full_numbers',
      pageLength: 5,
      processing: true
    };
    this.reloadData();
  }

  reloadData() {
    this.dispositivoService.getDispositivosList().subscribe(data => {
      this.dispositivo$ = data;
      this.dtTrigger.next(data);
    });
  }

  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();
  }

  deleteDispositivo(id: number) {
    this.dispositivoService.deleteDispositivo(id).subscribe({
      next: () => this.reloadData(),
      error: err => console.log(err)
    });
  }
}
