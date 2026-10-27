import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Sede {
  id?: number;
  sede: string;
}

@Injectable({
  providedIn: 'root'
})
export class SedeService {
  private baseUrl = '/api/v1/sedes';

  constructor(private http: HttpClient) {}

  getListSedes(): Observable<Sede[]> {
    return this.http.get<Sede[]>(`${this.baseUrl}`);
  }

  getSede(id: number): Observable<Sede> {
    return this.http.get<Sede>(`${this.baseUrl}/${id}`);
  }

  createSede(sede: Sede): Observable<Sede> {
    return this.http.post<Sede>(`${this.baseUrl}`, sede);
  }

  updateSede(id: number, sede: Sede): Observable<Sede> {
    return this.http.put<Sede>(`${this.baseUrl}/${id}`, sede);
  }

  deleteSede(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
