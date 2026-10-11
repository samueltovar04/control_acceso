import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private accesoSubject = new Subject<any>();
  private notifSubject = new Subject<any>();
  private signosSubject = new Subject<any>();

  private wsAcceso?: WebSocket;
  private wsNotif?: WebSocket;
  private wsSignos?: WebSocket;

  constructor() {
    this.connectWebSockets();
  }

  private connectWebSockets(): void {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;

    // WebSocket Acceso
    this.wsAcceso = new WebSocket(`${protocol}//${host}/ws/acceso`);
    this.wsAcceso.onmessage = (event) => this.accesoSubject.next(JSON.parse(event.data));

    // WebSocket Notificaciones
    this.wsNotif = new WebSocket(`${protocol}//${host}/ws/notificaciones`);
    this.wsNotif.onmessage = (event) => this.notifSubject.next(JSON.parse(event.data));

    // WebSocket Signos Vitales
    this.wsSignos = new WebSocket(`${protocol}//${host}/ws/signos-vitales`);
    this.wsSignos.onmessage = (event) => this.signosSubject.next(JSON.parse(event.data));
  }

  getAccesoEvents(): Observable<any> {
    return this.accesoSubject.asObservable();
  }

  getNotificacionesEvents(): Observable<any> {
    return this.notifSubject.asObservable();
  }

  getSignosVitalesEvents(): Observable<any> {
    return this.signosSubject.asObservable();
  }
}
