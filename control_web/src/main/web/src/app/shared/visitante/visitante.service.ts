import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Visitante } from './visitante.model';

@Injectable()
export class VisitanteService {

private baseUrl = '/api/v1/visitas';

constructor(private http: HttpClient) { }

  getVisitante(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  createVisitante(visita: Object): Observable<Object> {
      return this.http.post(`${this.baseUrl}`, visita);

  }

  updateVisitante(id: number, value: any): Observable<Object> {
    return this.http.put(`${this.baseUrl}/${id}`, value);
  }

  deleteVisitante(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  getVisitantesList(): Observable<any> {
    return this.http.get(`${this.baseUrl}`);
  }

  getTokenQr(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}/qr`);
  }
}
