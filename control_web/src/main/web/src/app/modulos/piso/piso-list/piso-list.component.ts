import { Component, OnDestroy, OnInit } from '@angular/core';
import { PisoService } from '../../../shared/piso/piso.service';
import { Piso } from "../../../shared/piso/piso.model";
import { Observable, Subject } from "rxjs";

@Component({
  selector: 'app-piso-list',
  templateUrl: './piso-list.component.html',
  styleUrls: ['./piso-list.component.css']
})
export class PisoListComponent implements OnInit, OnDestroy {
  piso$: Observable<Piso> | any;
  dtOptions: any = {};
  dtTrigger: Subject<any> = new Subject<any>();

  constructor(private pisoService: PisoService) { }

  ngOnInit() {
    this.dtOptions = {
      pagingType: 'full_numbers',
      pageLength: 5,
      processing: true
    };
    this.reloadData();
  }

  reloadData() {
    this.pisoService.getPisosList().subscribe(data => {
      this.piso$ = data;
      this.dtTrigger.next(data);
    });
  }

  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();
  }

  deletePiso(id: number) {
    this.pisoService.deletePiso(id).subscribe({
      next: () => this.reloadData(),
      error: err => console.log(err)
    });
  }
}
