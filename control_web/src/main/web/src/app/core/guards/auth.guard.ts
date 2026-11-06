import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.checkAuth(state.url);
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.checkAuth(state.url);
  }

  private checkAuth(url: string): boolean {
    if (this.authService.isLoggedIn()) {
      const cleanUrl = url.split('?')[0];

      // 1. Regla Restrictiva para CLIENTE (Aislamiento Total al Portal Cliente)
      if (this.authService.isCliente() && !this.authService.canViewCrossUserData()) {
        if (cleanUrl !== '/home/portal-cliente') {
          this.router.navigate(['/home/portal-cliente']);
          return false;
        }
        return true;
      }

      // 2. Regla para CONTABLE (Modulo financiero y consulta de clientes)
      if (this.authService.isContable() && !this.authService.isAdminOrSuperAdmin()) {
        if (cleanUrl.startsWith('/home/usuarios') ||
            cleanUrl.startsWith('/home/dispositivos') ||
            cleanUrl.startsWith('/home/dispositivo') ||
            cleanUrl.startsWith('/home/pisos') ||
            cleanUrl.startsWith('/home/piso') ||
            cleanUrl.startsWith('/home/sedes') ||
            cleanUrl.startsWith('/home/gerencias') ||
            cleanUrl.startsWith('/home/tipo-contratos')) {
          this.router.navigate(['/home/pagos']);
          return false;
        }
      }

      // 3. Regla para ANALISTA / RECEPCION / OPERACION (Gestion operativa sin finanzas sensibles ni usuarios)
      if ((this.authService.isAnalista() || this.authService.isOperacion()) &&
          !this.authService.isAdminOrSuperAdmin() && !this.authService.isContable()) {
        if (cleanUrl.startsWith('/home/usuarios') ||
            cleanUrl.startsWith('/home/conciliacion') ||
            cleanUrl.startsWith('/home/bancos')) {
          this.router.navigate(['/home/admin-dashboard']);
          return false;
        }
      }

      return true;
    }

    // Redirige obligatoriamente al login si no tiene sesion activa
    this.router.navigate(['/login'], { queryParams: { returnUrl: url } });
    return false;
  }
}
