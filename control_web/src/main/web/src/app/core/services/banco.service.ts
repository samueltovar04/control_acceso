import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Banco {
  id?: number;
  nombre: string;
  codigo?: string;
  tipo: 'PAGO_MOVIL' | 'TRANSFERENCIA' | 'ZELLE' | 'BINANCE' | 'EFECTIVO' | 'OTRO';
  numeroCuenta?: string;
  titular?: string;
  documentoTitular?: string;
  telefono?: string;
  email?: string;
  red?: string;
  direccionBilletera?: string;
  memoQr?: string;
  moneda?: string;
  notasInstruccion?: string;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BancoService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/bancos';

  getBancosActivos(tipo?: string): Observable<Banco[]> {
    const url = tipo ? `${this.apiUrl}?tipo=${encodeURIComponent(tipo)}` : this.apiUrl;
    return this.http.get<Banco[]>(url);
  }

  getTodos(): Observable<Banco[]> {
    return this.http.get<Banco[]>(`${this.apiUrl}/todos`);
  }

  getPorId(id: number): Observable<Banco> {
    return this.http.get<Banco>(`${this.apiUrl}/${id}`);
  }

  crearBanco(banco: Banco): Observable<Banco> {
    return this.http.post<Banco>(this.apiUrl, banco);
  }

  actualizarBanco(id: number, banco: Banco): Observable<Banco> {
    return this.http.put<Banco>(`${this.apiUrl}/${id}`, banco);
  }

  eliminarBanco(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
