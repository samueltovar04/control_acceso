import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SignosVitales {
  id?: number;
  cliente?: any;
  ritmocardiacoBpm: number;
  saturacionOxigenoSpo2: number;
  temperaturaCorporal: number;
  nivelEstres: number;
  presionArterial?: string;
  alertaSalud?: boolean;
  mensajeAlerta?: string;
  timestamp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SignosVitalesService {
  private apiUrl = '/api/v1/telemetria';

  constructor(private http: HttpClient) {}

  getHistorialCliente(clienteId: number): Observable<SignosVitales[]> {
    return this.http.get<SignosVitales[]>(`${this.apiUrl}/cliente/${clienteId}`);
  }

  getUltimoCliente(clienteId: number): Observable<SignosVitales> {
    return this.http.get<SignosVitales>(`${this.apiUrl}/cliente/${clienteId}/ultimo`);
  }

  getAlertasActivas(): Observable<SignosVitales[]> {
    return this.http.get<SignosVitales[]>(`${this.apiUrl}/alertas`);
  }

  registrarTelemetria(signos: SignosVitales): Observable<SignosVitales> {
    return this.http.post<SignosVitales>(`${this.apiUrl}/signos-vitales`, signos);
  }

  getHistorialMongo(limite: number = 2000, idPulsera?: string, fecha?: string): Observable<any[]> {
    let url = `${this.apiUrl}/gateway-ingest/historico?limite=${limite}`;
    if (idPulsera && idPulsera.trim()) {
      url += `&id_pulsera=${encodeURIComponent(idPulsera.trim())}`;
    }
    if (fecha && fecha.trim()) {
      url += `&fecha=${encodeURIComponent(fecha.trim())}`;
    }
    return this.http.get<any[]>(url);
  }

  getHistorialMongoPorPulsera(idPulsera: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/gateway-ingest/historico/${idPulsera}`);
  }
}
