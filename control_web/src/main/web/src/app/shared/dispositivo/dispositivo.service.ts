import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dispositivo } from './dispositivo.model';

@Injectable()
export class DispositivoService {

private baseUrl = '/api/v1/dispositivos';

constructor(private http: HttpClient) { }

  getDispositivo(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  createDispositivo(dispo: Object): Observable<Object> {
      return this.http.post(`${this.baseUrl}`, dispo);
  }

  updateDispositivo(id: number, value: any): Observable<Object> {
    return this.http.put(`${this.baseUrl}/${id}`, value);
  }

  deleteDispositivo(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  getDispositivosList(): Observable<any> {
    return this.http.get(`${this.baseUrl}`);
  }

  abrirDispositivo(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id}/abrir`, {});
  }

  toggleState(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/toggle-state`, {});
  }

  pingAll(): Observable<any> {
    return this.http.post(`${this.baseUrl}/ping-all`, {});
  }

  escanearDispositivo(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}/escanear`);
  }

  descubrirNoRegistrados(subred?: string, ips?: string[]): Observable<any> {
    let url = `${this.baseUrl}/no-registrados`;
    const params: string[] = [];
    if (subred && subred.trim()) {
      params.push(`subred=${encodeURIComponent(subred.trim())}`);
    }
    if (ips && ips.length > 0) {
      params.push(`ips=${encodeURIComponent(ips.join(','))}`);
    }
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    return this.http.get(url);
  }

  registrarLote(dispositivos: any[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/registrar-lote`, dispositivos);
  }
}
