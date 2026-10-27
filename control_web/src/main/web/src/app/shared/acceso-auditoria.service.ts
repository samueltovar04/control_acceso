import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AccesoRegistroItem {
  id: number;
  fechaHora: string;
  concedido: boolean;
  metodoVerificacion: string;
  motivoDenegacion?: string;
  cliente?: any;
  empleado?: any;
  dispositivo?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AccesoAuditoriaService {

  private baseUrl = '/api/v1/acceso';

  constructor(private http: HttpClient) { }

  getRegistrosRecientes(): Observable<AccesoRegistroItem[]> {
    return this.http.get<AccesoRegistroItem[]>(`${this.baseUrl}/registros`);
  }

  getAccesosPermitidos(): Observable<AccesoRegistroItem[]> {
    return this.http.get<AccesoRegistroItem[]>(`${this.baseUrl}/historial/permitidos`);
  }

  getAccesosDenegados(): Observable<AccesoRegistroItem[]> {
    return this.http.get<AccesoRegistroItem[]>(`${this.baseUrl}/historial/denegados`);
  }
}
