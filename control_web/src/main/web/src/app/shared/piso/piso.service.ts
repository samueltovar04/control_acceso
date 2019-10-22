import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Piso } from './piso.model';

@Injectable()
export class PisoService {

private baseUrl = 'http://localhost:8080/api/v1/pisos';

constructor(private http: HttpClient) { }

  getPiso(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  createPiso(piso: Object): Observable<Object> {
      return this.http.post(`${this.baseUrl}`, piso);

  }

  updatePiso(id: number, value: any): Observable<Object> {
    return this.http.put(`${this.baseUrl}/${id}`, value);
  }

  deletePiso(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
  }

  getPisosList(): Observable<any> {
    return this.http.get(`${this.baseUrl}`);
  }
}
