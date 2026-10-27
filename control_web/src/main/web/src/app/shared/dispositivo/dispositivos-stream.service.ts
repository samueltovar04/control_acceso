import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface DispositivoStatus {
  dispositivoId: number;
  ip: string;
  nombre?: string;
  online: boolean;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class DispositivosStreamService {

  private socket?: WebSocket;
  private statusSubject = new Subject<DispositivoStatus>();

  constructor() {
    this.connect();
  }

  private connect(): void {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/dispositivos`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.statusSubject.next(data);
        } catch (e) {
          console.warn('Formato no JSON en WebSocket dispositivos:', event.data);
        }
      };

      this.socket.onclose = () => {
        setTimeout(() => this.connect(), 5000);
      };

      this.socket.onerror = (err) => {
        console.warn('WebSocket dispositivos error:', err);
      };
    } catch (err) {
      console.warn('No se pudo inicializar WebSocket dispositivos:', err);
    }
  }

  getDispositivoStatusStream(): Observable<DispositivoStatus> {
    return this.statusSubject.asObservable();
  }

  enviarHeartbeat(dispositivoId: number, online: boolean): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ dispositivoId, online, timestamp: Date.now() }));
    }
  }
}
