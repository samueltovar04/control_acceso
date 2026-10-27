import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TipoContrato {
  id?: number;
  contrato: string;
}

@Injectable({
  providedIn: 'root'
})
export class TipoContratoService {
  private baseUrl = '/api/v1/tipocontratos';

  constructor(private http: HttpClient) {}

  getListTipoContratos(): Observable<TipoContrato[]> {
    return this.http.get<TipoContrato[]>(`${this.baseUrl}`);
  }

  getTipoContrato(id: number): Observable<TipoContrato> {
    return this.http.get<TipoContrato>(`${this.baseUrl}/${id}`);
  }

  createTipoContrato(tipoContrato: TipoContrato): Observable<TipoContrato> {
    return this.http.post<TipoContrato>(`${this.baseUrl}`, tipoContrato);
  }

  updateTipoContrato(id: number, tipoContrato: TipoContrato): Observable<TipoContrato> {
    return this.http.put<TipoContrato>(`${this.baseUrl}/${id}`, tipoContrato);
  }

  deleteTipoContrato(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
