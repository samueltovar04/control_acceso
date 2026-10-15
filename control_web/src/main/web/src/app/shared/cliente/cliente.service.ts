import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente } from './cliente.model';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private baseUrl = '/api/v1/clientes';

  constructor(private http: HttpClient) { }

  getClientesList(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.baseUrl}`);
  }

  getClientes(): Observable<Cliente[]> {
    return this.getClientesList();
  }

  getCliente(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.baseUrl}/${id}`);
  }

  createCliente(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.baseUrl}`, cliente);
  }

  updateCliente(id: number, cliente: Cliente): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.baseUrl}/${id}`, cliente);
  }

  deleteCliente(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  getPerfil(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}/perfil`);
  }

  getTokenQr(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}/qr`);
  }

  actualizarBiometria(id: number, biometria: { huella1?: string; huella2?: string; faceVector?: string }): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/biometria`, biometria);
  }

  actualizarMembresia(cliente: Cliente, estadoSuscripcion: string): Observable<Cliente> {
    const payload: Cliente = {
      ...cliente,
      pisosPermitidos: cliente.pisosPermitidos || [],
      estadoSuscripcion
    };
    return this.http.put<Cliente>(`${this.baseUrl}/${cliente.id}`, payload);
  }

  asignarMembresiaAlCliente(clienteId: number, membresiaId: number, estadoSuscripcion: string = 'ACTIVA', codigoCupon?: string, metodoPago?: string): Observable<any> {
    return this.http.put(`/api/clientes/${clienteId}/asignar-membresia`, {
      membresiaId,
      estadoSuscripcion,
      codigoCupon: codigoCupon || null,
      metodoPago: metodoPago || 'EFECTIVO',
      registrarPago: true
    });
  }

  asignarPulsera(cliente: Cliente, codigoInsignia: string): Observable<Cliente> {
    const payload: Cliente = {
      ...cliente,
      pisosPermitidos: cliente.pisosPermitidos || [],
      codigoInsignia
    };
    return this.http.put<Cliente>(`${this.baseUrl}/${cliente.id}`, payload);
  }
}
