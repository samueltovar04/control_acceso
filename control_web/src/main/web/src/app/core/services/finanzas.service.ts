import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Pago {
  id?: number;
  cliente?: any;
  monto: number;
  fechaPago?: string;
  metodoPago: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'APP_ONLINE';
  origenPago: 'WEB_ADMIN' | 'WEB_CLIENTE' | 'APP_MOBILE';
  registradoPor: string;
  numeroReferencia?: string;
  comprobanteUrl?: string;
  estadoPago: 'COMPLETADO' | 'PENDIENTE_CONCILIACION' | 'RECHAZADO';
}

export interface Conciliacion {
  id?: number;
  pago: Pago;
  montoExtractoBancario: number;
  montoRegistrado: number;
  estado: 'CONCILIADO' | 'DISCREPANCIA' | 'PENDIENTE';
  observaciones?: string;
  conciliadoPorUser: string;
}

export interface Gasto {
  id?: number;
  descripcion: string;
  categoria: 'MANTENIMIENTO' | 'SERVICIOS' | 'SUMINISTROS' | 'PERSONAL' | 'EQUIPAMIENTO' | 'OTRO';
  monto: number;
  fechaGasto?: string;
  registradoPor?: string;
}

export interface BalanceFinanciero {
  totalIngresos: number;
  totalGastos: number;
  balanceNeto: number;
  totalTransaccionesIngresos: number;
  totalRegistrosGastos: number;
}

@Injectable({
  providedIn: 'root'
})
export class FinanzasService {
  private apiUrl = '/api/v1/finanzas';

  constructor(private http: HttpClient) {}

  getPagos(): Observable<Pago[]> {
    return this.http.get<Pago[]>(`${this.apiUrl}/pagos`);
  }

  getPagosPorCliente(clienteId: number): Observable<Pago[]> {
    return this.http.get<Pago[]>(`${this.apiUrl}/pagos/cliente/${clienteId}`);
  }

  registrarPago(pago: Pago): Observable<Pago> {
    return this.http.post<Pago>(`${this.apiUrl}/pagos`, pago);
  }

  getPendientesConciliacion(): Observable<Pago[]> {
    return this.http.get<Pago[]>(`${this.apiUrl}/conciliacion/pendientes`);
  }

  conciliarPago(conciliacion: Conciliacion): Observable<Conciliacion> {
    return this.http.post<Conciliacion>(`${this.apiUrl}/conciliacion`, conciliacion);
  }

  getDeudores(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/deudores`);
  }

  getBalance(): Observable<BalanceFinanciero> {
    return this.http.get<BalanceFinanciero>(`${this.apiUrl}/balance`);
  }

  getGastos(): Observable<Gasto[]> {
    return this.http.get<Gasto[]>(`${this.apiUrl}/gastos`);
  }

  registrarGasto(gasto: Gasto): Observable<Gasto> {
    return this.http.post<Gasto>(`${this.apiUrl}/gastos`, gasto);
  }
}
