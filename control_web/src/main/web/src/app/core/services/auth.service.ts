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

  private parseJwtPayload(token: string): any {
    if (!token || !token.includes('.')) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  private resolvePrimaryRole(roles: string[]): string {
    if (!roles || roles.length === 0) return 'ROLE_EMPLEADO';
    if (roles.some(r => r.includes('SUPER_ADMIN') || r === 'SUPERADMIN')) return 'ROLE_SUPER_ADMIN';
    if (roles.some(r => r.includes('ADMIN'))) return 'ROLE_ADMIN';
    if (roles.some(r => r.includes('CONTABLE') || r.includes('CONTADOR'))) return 'ROLE_CONTABLE';
    if (roles.some(r => r.includes('ANALISTA'))) return 'ROLE_ANALISTA';
    if (roles.some(r => r.includes('RECEPCION') || r.includes('OPERACION') || r.includes('SEGURIDAD'))) return 'ROLE_OPERACION';
    if (roles.some(r => r.includes('CLIENTE'))) return 'ROLE_CLIENTE';
    return roles[0];
  }

  private getUserFromStorage(): UserAuth | null {
    const saved = localStorage.getItem('currentUser');
    if (!saved) {
      return null;
    }
    try {
      const parsed: UserAuth = JSON.parse(saved);
      if (parsed && parsed.token) {
        const claims = this.parseJwtPayload(parsed.token);
        if (claims) {
          if (claims.groups && Array.isArray(claims.groups)) {
            parsed.roles = claims.groups;
            parsed.role = this.resolvePrimaryRole(claims.groups);
          }
          const isPrivileged = parsed.roles && parsed.roles.some((r: string) =>
            r.includes('ADMIN') || r.includes('SUPER_ADMIN') || r.includes('CONTABLE') || r.includes('ANALISTA')
          );
          if (isPrivileged) {
            parsed.clienteId = undefined;
          } else if (claims.clienteId !== undefined && claims.clienteId !== null) {
            parsed.clienteId = Number(claims.clienteId) > 0 ? Number(claims.clienteId) : undefined;
          }
        }
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
          const claims = this.parseJwtPayload(res.token);
          const rawRoles = (claims && claims.groups && Array.isArray(claims.groups))
            ? claims.groups
            : (res.roles || [res.role || 'ROLE_EMPLEADO']);
          const primaryRole = this.resolvePrimaryRole(rawRoles);
          const isPrivileged = rawRoles.some((r: string) =>
            r.includes('ADMIN') || r.includes('SUPER_ADMIN') || r.includes('CONTABLE') || r.includes('ANALISTA')
          );

          const resolvedClienteId = isPrivileged ? undefined : (
            (claims && claims.clienteId && Number(claims.clienteId) > 0)
              ? Number(claims.clienteId)
              : (res.clienteId ? Number(res.clienteId) : undefined)
          );

          const user: UserAuth = {
            token: res.token,
            username: res.username || res.correo || 'Usuario',
            role: primaryRole,
            roles: rawRoles,
            clienteId: resolvedClienteId,
            sedeId: res.sedeId ? Number(res.sedeId) : undefined,
            sedeNombre: res.sedeNombre,
            nombreCompleto: res.nombreCompleto,
            requiresPasswordReset: !!res.requiresPasswordReset
          };
          localStorage.setItem('currentUser', JSON.stringify(user));
          localStorage.setItem('auth_token', user.token);
          localStorage.setItem('usuario_activo', user.username);
          if (user.clienteId) {
            localStorage.setItem('cliente_id', user.clienteId.toString());
          } else {
            localStorage.removeItem('cliente_id');
          }
          this.currentUserSubject.next(user);
        }
      })
    );
  }

  setSessionFromBiometric(res: any, fallbackName: string = 'Usuario'): void {
    if (!res) return;
    const assignedRole = res.role || res.persona?.rol || 'ROLE_EMPLEADO';
    const user: UserAuth = {
      token: res.token || 'JWT_BIOMETRIC_TOKEN_' + Date.now(),
      username: res.username || res.persona?.documento || res.persona?.document || 'usuario',
      role: assignedRole,
      roles: res.roles || [assignedRole],
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
    try {
      this.http.post<any>(`${this.apiUrl}/auth/logout`, {}).subscribe({
        next: () => {},
        error: () => {}
      });
    } catch (e) {}
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
    return this.hasRole('RECEPCION') || this.hasRole('ROLE_RECEPCION') || this.hasRole('RECEPCIONISTA') || this.hasRole('ROLE_RECEPCIONISTA');
  }

  isSeguridad(): boolean {
    return this.hasRole('SEGURIDAD') || this.hasRole('ROLE_SEGURIDAD') || this.hasRole('OFICIAL') || this.hasRole('ROLE_OFICIAL');
  }

  isAnalista(): boolean {
    return this.hasRole('ANALISTA') || this.hasRole('ROLE_ANALISTA');
  }

  isOperacion(): boolean {
    return this.hasRole('OPERACION') || this.hasRole('OPERADOR') || this.hasRole('EMPLEADO') ||
           this.hasRole('ROLE_OPERACION') || this.hasRole('ROLE_OPERADOR') || this.hasRole('ROLE_EMPLEADO') ||
           this.isSeguridad() || this.isAnalista();
  }

  isCliente(): boolean {
    return this.hasRole('CLIENTE') || this.hasRole('ROLE_CLIENTE');
  }

  hasSedeRestringida(): boolean {
    if (this.isAdminOrSuperAdmin()) return false;
    return this.isRecepcion() || this.isSeguridad() || this.isAnalista() || this.isOperacion() || this.isContable() || this.isCliente();
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
    if (this.isRecepcion() || this.isOperacion() || this.isContable()) return true;
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

  getAuthenticatedClienteId(): number | null {
    const user = this.currentUserValue;
    if (!user) return null;
    if (this.isAdminOrSuperAdmin() || this.isContable() || this.isAnalista()) return null;
    if (user.token) {
      const claims = this.parseJwtPayload(user.token);
      if (claims && claims.clienteId && Number(claims.clienteId) > 0) {
        return Number(claims.clienteId);
      }
    }
    return user.clienteId || null;
  }

  canViewCrossUserData(): boolean {
    return this.isAdminOrSuperAdmin() || this.isContable() || this.isAnalista() || this.isOperacion();
  }
}
