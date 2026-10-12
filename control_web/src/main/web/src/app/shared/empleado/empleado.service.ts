import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Empleado } from './empleado.model';

@Injectable()
export class EmpleadoService {

private baseUrl = '/api/v1/empleados';

constructor(private http: HttpClient) { }

  getEmployee(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  createEmployee(employee: Object): Observable<any> {
      return this.http.post(`${this.baseUrl}`, employee);
  }

  updateEmployee(id: number, value: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, value);
  }

  deleteEmployee(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  getEmployeesList(): Observable<any> {
    return this.http.get(`${this.baseUrl}`);
  }

  getPerfil(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}/perfil`);
  }

  getTokenQr(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}/qr`);
  }
}
