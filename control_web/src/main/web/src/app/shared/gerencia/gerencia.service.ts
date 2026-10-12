import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Gerencia {
  id?: number;
  gerencia: string;
}

@Injectable({
  providedIn: 'root'
})
export class GerenciaService {
  private baseUrl = '/api/v1/gerencias';

  constructor(private http: HttpClient) {}

  getListGerencias(): Observable<Gerencia[]> {
    return this.http.get<Gerencia[]>(`${this.baseUrl}`);
  }

  getGerencia(id: number): Observable<Gerencia> {
    return this.http.get<Gerencia>(`${this.baseUrl}/${id}`);
  }

  createGerencia(gerencia: Gerencia): Observable<Gerencia> {
    return this.http.post<Gerencia>(`${this.baseUrl}`, gerencia);
  }

  updateGerencia(id: number, gerencia: Gerencia): Observable<Gerencia> {
    return this.http.put<Gerencia>(`${this.baseUrl}/${id}`, gerencia);
  }

  deleteGerencia(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
