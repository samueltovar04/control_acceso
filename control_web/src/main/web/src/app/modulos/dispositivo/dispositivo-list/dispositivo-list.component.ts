import { Component, OnInit, OnDestroy,OnChanges,DoCheck } from '@angular/core';
import { DispositivoService } from '../../../shared/dispositivo/dispositivo.service';
import { Dispositivo } from "../../../shared/dispositivo/dispositivo.model";
import { GlobalVariable } from '../../../global';
import { Observable,Subject } from "rxjs";
import * as Stomp from 'stompjs';
import * as SockJS from 'sockjs-client';
import * as $ from 'jquery';
import 'datatables.net';
import 'datatables.net-bs4';
@Component({
  selector: 'app-dispositivo-list',
  templateUrl: './dispositivo-list.component.html',
  styleUrls: ['./dispositivo-list.component.css']
})
export class DispositivoListComponent implements OnInit, OnDestroy ,DoCheck,OnChanges {
webSocketEndPoint: string = GlobalVariable.BASE_SOCKET_URL;
private timelbl;
private stompClients;
private isChecked = true;
public counts: any;
    dispositivo$: Observable<Dispositivo>;
    dataTable: any;
    public rowsOnPage = 10;
    public sortBy = "name";
    public sortOrder = "asc";

    dtOptions: DataTables.Settings = {};
    dtTrigger: Subject<any> = new Subject();
    constructor(private dispositivoService: DispositivoService) {

   console.log("Initialize WebSocket Connection");
        let ws = new SockJS(this.webSocketEndPoint);
        this.stompClients = Stomp.over(ws);
  }

    ngOnInit() {

    this.initializeWebSocketConnection();
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
    this.dispositivoService.getDispositivosList().subscribe(data => {
        console.log(data);
        this.dispositivo$ = data;
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
  deleteDispositivo(id: number) {
    this.dispositivoService.deleteDispositivo(id)
      .subscribe(
        data => {
          console.log(data);
          this.reloadData();
        },
        error => console.log(error));
  }

  ngOnChanges(){
      this.initializeWebSocketConnection();
  }

  ngDoCheck(){
      this.initializeWebSocketConnection();
  }

  initializeWebSocketConnection(){
    let that = this;
    this.stompClients.connect({}, function(frame) {
      that.stompClients.debug = null;
      console.log("entra");
      that.stompClients.subscribe("/cliente/dispositivos", (message) => {
        console.log(message);
        if(message.body) {
          const myObjStr = JSON.stringify(message.body);
          console.log(myObjStr);
          that.counts=JSON.parse(message.body);
          console.log(that.counts);
          that.dispositivo$ = that.counts;
          console.log(that.dispositivo$);
        }
      });
    });
    this.isChecked = true;
    this.timelbl = 'Connected';
  }

  finalizeWebSocketConnection(){
    this.stompClients.disconnect();
    this.isChecked = false;
    this.timelbl = 'Disconnected';
  }

  sendMessage(message){
    this.stompClients.send("/app/sendMessage" , {}, message);

  }

  onChange(e){
    if (e.checked == false) {
      this.finalizeWebSocketConnection();
    }else{
      this.initializeWebSocketConnection();
    }
  }

}
