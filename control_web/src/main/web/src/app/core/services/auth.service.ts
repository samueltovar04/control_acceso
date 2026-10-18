import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface UserAuth {
  token: string;
  username: string;
  role: 'ADMIN' | 'EMPLEADO' | 'CLIENTE' | 'RECEPCION' | 'SUPER_ADMIN' | string;
  roles?: string[];
  clienteId?: number;
  sedeId?: number;
  sedeNombre?: string;
  sede?: any;
  nombreCompleto?: string;
  requiresPasswordReset?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/v1';
  private currentUserSubject = new BehaviorSubject<UserAuth | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getUserFromStorage(): UserAuth | null {
    const saved = localStorage.getItem('currentUser');
    if (!saved) {
      return null;
    }
    try {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.token) {
        return parsed;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  public get currentUserValue(): UserAuth | null {
    return this.currentUserSubject.value;
  }

  login(credentials: { username?: string; correo?: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(res => {
        if (res && res.token) {
          const user: UserAuth = {
            token: res.token,
            username: res.username || res.correo || 'Usuario',
            role: res.role || 'ROLE_EMPLEADO',
            roles: res.roles || [res.role || 'ROLE_EMPLEADO'],
            sedeId: res.sedeId ? Number(res.sedeId) : undefined,
            sedeNombre: res.sedeNombre,
            nombreCompleto: res.nombreCompleto,
            requiresPasswordReset: !!res.requiresPasswordReset
          };
          localStorage.setItem('currentUser', JSON.stringify(user));
          localStorage.setItem('auth_token', user.token);
          localStorage.setItem('usuario_activo', user.username);
          this.currentUserSubject.next(user);
        }
      })
    );
  }

  setSessionFromBiometric(res: any, fallbackName: string = 'Usuario'): void {
    if (!res) return;
    const user: UserAuth = {
      token: res.token || 'JWT_BIOMETRIC_TOKEN_' + Date.now(),
      username: res.username || res.persona?.documento || res.persona?.document || 'superadmin',
      role: res.role || 'ROLE_ADMIN',
      roles: res.roles || [res.role || 'ROLE_ADMIN'],
      sedeId: res.sedeId ? Number(res.sedeId) : undefined,
      sedeNombre: res.sedeNombre,
      nombreCompleto: res.nombreCompleto || res.persona?.nombre || fallbackName,
      requiresPasswordReset: false
    };
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('auth_token', user.token);
    localStorage.setItem('usuario_activo', user.nombreCompleto || user.username);
    this.currentUserSubject.next(user);
  }

  cambiarClave(data: { username?: string; correo?: string; nuevaClave: string; confirmacionClave: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/cambiar-clave`, data);
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('usuario_activo');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue && !!this.currentUserValue.token;
  }

  hasRole(role: string): boolean {
    if (!this.currentUserValue) return false;
    const r = (this.currentUserValue.role || '').toUpperCase();
    const search = role.toUpperCase();
    if (r === search || r === `ROLE_${search}`) return true;
    if (this.currentUserValue.roles) {
      return this.currentUserValue.roles.some(
        x => x.toUpperCase() === search || x.toUpperCase() === `ROLE_${search}`
      );
    }
    return false;
  }

  isAdminOrSuperAdmin(): boolean {
    if (!this.currentUserValue) return false;
    const r = (this.currentUserValue.role || '').toUpperCase();
    if (r === 'ADMIN' || r === 'ROLE_ADMIN' || r === 'SUPER_ADMIN' || r === 'ROLE_SUPER_ADMIN' || r === 'SUPERADMIN') {
      return true;
    }
    if (this.currentUserValue.roles) {
      return this.currentUserValue.roles.some(x => {
        const up = x.toUpperCase();
        return up === 'ADMIN' || up === 'ROLE_ADMIN' || up === 'SUPER_ADMIN' || up === 'ROLE_SUPER_ADMIN' || up === 'SUPERADMIN';
      });
    }
    return false;
  }

  isContable(): boolean {
    return this.hasRole('CONTABLE') || this.hasRole('CONTADOR') || this.hasRole('ROLE_CONTABLE');
  }

  isRecepcion(): boolean {
    return this.hasRole('RECEPCION') || this.hasRole('ROLE_RECEPCION');
  }

  isOperacion(): boolean {
    return this.hasRole('OPERACION') || this.hasRole('OPERADOR') || this.hasRole('EMPLEADO') ||
           this.hasRole('ROLE_OPERACION') || this.hasRole('ROLE_OPERADOR') || this.hasRole('ROLE_EMPLEADO');
  }

  isCliente(): boolean {
    return this.hasRole('CLIENTE') || this.hasRole('ROLE_CLIENTE');
  }

  // Modulo Panel & Vision
  canViewPanelVision(): boolean {
    if (this.isAdminOrSuperAdmin()) return true;
    if (this.isRecepcion() || this.isOperacion()) return true;
    return false;
  }

  // Modulo Gestion de Pagos
  canViewPagos(): boolean {
    if (this.isAdminOrSuperAdmin()) return true;
    if (this.isContable()) return true;
    return false;
  }

  // Modulo Gestion de Acceso (Clientes, Empleados, Visitantes, Membresias)
  canViewGestionAcceso(): boolean {
    if (this.isAdminOrSuperAdmin()) return true;
    if (this.isRecepcion() || this.isOperacion()) return true;
    return false;
  }

  // Modulo Infraestructura y Ubicaciones (Dispositivos, Pisos, Sedes, Gerencias)
  canViewInfraestructura(): boolean {
    return this.isAdminOrSuperAdmin();
  }

  // Modulo Portal Cliente (Solo Clientes o Admins)
  canViewPortalCliente(): boolean {
    if (this.isAdminOrSuperAdmin()) return true;
    if (this.isCliente()) return true;
    return false;
  }

  canManageUsers(): boolean {
    return this.isAdminOrSuperAdmin();
  }
}
