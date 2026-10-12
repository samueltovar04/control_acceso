import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Piso } from '../piso/piso.model';

@Injectable({
  providedIn: 'root'
})
export class PermisosService {
  private baseUrl = '/api/v1/permisos';

  constructor(private http: HttpClient) {}

  getPisos(): Observable<Piso[]> {
    return this.http.get<Piso[]>(`${this.baseUrl}/pisos`);
  }

  getPisosEmpleado(id: number): Observable<Piso[]> {
    return this.http.get<Piso[]>(`${this.baseUrl}/empleados/${id}`);
  }

  updatePisosEmpleado(id: number, pisoIds: number[]): Observable<Piso[]> {
    return this.http.put<Piso[]>(`${this.baseUrl}/empleados/${id}`, pisoIds);
  }

  getPisosCliente(id: number): Observable<Piso[]> {
    return this.http.get<Piso[]>(`${this.baseUrl}/clientes/${id}`);
  }

  updatePisosCliente(id: number, pisoIds: number[]): Observable<Piso[]> {
    return this.http.put<Piso[]>(`${this.baseUrl}/clientes/${id}`, pisoIds);
  }

  getPisosVisitante(id: number): Observable<Piso[]> {
    return this.http.get<Piso[]>(`${this.baseUrl}/visitantes/${id}`);
  }

  updatePisosVisitante(id: number, pisoIds: number[]): Observable<Piso[]> {
    return this.http.put<Piso[]>(`${this.baseUrl}/visitantes/${id}`, pisoIds);
  }
}
