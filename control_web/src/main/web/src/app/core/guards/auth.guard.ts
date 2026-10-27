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
      if (this.authService.isCliente() && !this.authService.isAdminOrSuperAdmin()) {
        const cleanUrl = url.split('?')[0];
        if (cleanUrl !== '/home/portal-cliente') {
          this.router.navigate(['/home/portal-cliente']);
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
