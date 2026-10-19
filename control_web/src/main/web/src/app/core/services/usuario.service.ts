import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserDTO {
  id?: number;
  username: string;
  email?: string;
  nombreCompleto?: string;
  enabled?: boolean;
  requiresPasswordReset?: boolean;
  lastLogin?: string;
  sedeId?: number;
  sedeNombre?: string;
  roles?: string[];
  password?: string;
  empleadoId?: number;
}

export interface AuditoriaAcceso {
  id?: number;
  userId?: number;
  username: string;
  sedeId?: number;
  sedeNombre?: string;
  ipAddress?: string;
  userAgent?: string;
  fechaHora: string;
  accion: string;
  estado: string;
  detalles?: string;
}

export interface SesionActiva {
  id: number;
  userId?: number;
  username: string;
  tokenId?: string;
  ipAddress?: string;
  userAgent?: string;
  sedeId?: number;
  sedeNombre?: string;
  fechaInicio: string;
  ultimaActividad: string;
  activa: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = '/api/v1/usuarios';

  constructor(private http: HttpClient) {}

  getUsuarios(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(this.apiUrl);
  }

  getUsuario(id: number): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.apiUrl}/${id}`);
  }

  crearUsuario(user: UserDTO): Observable<UserDTO> {
    return this.http.post<UserDTO>(this.apiUrl, user);
  }

  actualizarUsuario(id: number, user: UserDTO): Observable<UserDTO> {
    return this.http.put<UserDTO>(`${this.apiUrl}/${id}`, user);
  }

  cambiarEstado(id: number, enabled: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/estado`, { enabled });
  }

  forzarReseteoPassword(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/reset-password`, {});
  }

  getAuditoria(limit: number = 100): Observable<AuditoriaAcceso[]> {
    return this.http.get<AuditoriaAcceso[]>(`${this.apiUrl}/auditoria?limit=${limit}`);
  }

  getSesionesActivas(): Observable<SesionActiva[]> {
    return this.http.get<SesionActiva[]>(`${this.apiUrl}/sesiones-activas`);
  }

  revocarSesion(sesionId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/sesiones-activas/${sesionId}/revocar`, {});
  }
}
