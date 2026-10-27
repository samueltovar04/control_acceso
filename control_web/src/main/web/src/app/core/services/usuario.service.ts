import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PageResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface UserDTO {
  id?: number;
  username: string;
  nombreCompleto?: string;
  email?: string;
  enabled?: boolean;
  sedeId?: number;
  sedeNombre?: string;
  roles?: string[];
  password?: string;
  empleadoId?: number;
  requiresPasswordReset?: boolean;
}

export interface AuditoriaAcceso {
  id?: string | number;
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
  id?: string | number;
  idString?: string;
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

  getAuditoriaPaginada(page: number = 0, size: number = 15): Observable<PageResponse<AuditoriaAcceso>> {
    return this.http.get<PageResponse<AuditoriaAcceso>>(`${this.apiUrl}/auditoria?page=${page}&size=${size}`);
  }

  getSesionesActivas(): Observable<SesionActiva[]> {
    return this.http.get<SesionActiva[]>(`${this.apiUrl}/sesiones-activas`);
  }

  getSesionesActivasPaginadas(page: number = 0, size: number = 10): Observable<PageResponse<SesionActiva>> {
    return this.http.get<PageResponse<SesionActiva>>(`${this.apiUrl}/sesiones-activas?paginado=true&page=${page}&size=${size}`);
  }

  revocarSesion(sesionId: string | number): Observable<any> {
    return this.http.post(`${this.apiUrl}/sesiones-activas/${sesionId}/revocar`, {});
  }
}
