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
    this.conectarAcceso(protocol, host);

    // WebSocket Notificaciones
    this.conectarNotif(protocol, host);

    // WebSocket Signos Vitales
    this.conectarSignos(protocol, host);
  }

  private conectarAcceso(protocol: string, host: string): void {
    try {
      this.wsAcceso = new WebSocket(`${protocol}//${host}/ws/acceso`);
      this.wsAcceso.onmessage = (event) => {
        try { this.accesoSubject.next(JSON.parse(event.data)); } catch (e) {}
      };
      this.wsAcceso.onclose = () => setTimeout(() => this.conectarAcceso(protocol, host), 5000);
      this.wsAcceso.onerror = () => this.wsAcceso?.close();
    } catch (e) {}
  }

  private conectarNotif(protocol: string, host: string): void {
    try {
      this.wsNotif = new WebSocket(`${protocol}//${host}/ws/notificaciones`);
      this.wsNotif.onmessage = (event) => {
        try { this.notifSubject.next(JSON.parse(event.data)); } catch (e) {}
      };
      this.wsNotif.onclose = () => setTimeout(() => this.conectarNotif(protocol, host), 5000);
      this.wsNotif.onerror = () => this.wsNotif?.close();
    } catch (e) {}
  }

  private conectarSignos(protocol: string, host: string): void {
    try {
      this.wsSignos = new WebSocket(`${protocol}//${host}/ws/signos-vitales`);
      this.wsSignos.onmessage = (event) => {
        try { this.signosSubject.next(JSON.parse(event.data)); } catch (e) {}
      };
      this.wsSignos.onclose = () => setTimeout(() => this.conectarSignos(protocol, host), 5000);
      this.wsSignos.onerror = () => this.wsSignos?.close();
    } catch (e) {}
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
