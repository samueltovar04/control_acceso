import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dispositivo } from './dispositivo.model';

@Injectable()
export class DispositivoService {

private baseUrl = 'http://localhost:8080/api/v1/dispositivos';

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
    return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
  }

  getDispositivosList(): Observable<any> {
    return this.http.get(`${this.baseUrl}`);
  }
}
