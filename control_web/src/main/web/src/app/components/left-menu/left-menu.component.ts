import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarService } from '../../shared/services/sidebar.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-left-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './left-menu.component.html',
  styleUrls: ['./left-menu.component.css']
})
export class LeftMenuComponent {
  public sidebarService = inject(SidebarService);
  public authService = inject(AuthService);
  public router = inject(Router);
  menuPagosAbierto: boolean = true;

  onNavClick(): void {
    if (window.innerWidth < 768) {
      this.sidebarService.close();
    }
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isAdminOrSuperAdmin(): boolean {
    return this.authService.isAdminOrSuperAdmin();
  }

  canViewPanelVision(): boolean {
    return this.authService.canViewPanelVision();
  }

  canViewPagos(): boolean {
    return this.authService.canViewPagos();
  }

  canViewGestionAcceso(): boolean {
    return this.authService.canViewGestionAcceso();
  }

  canViewInfraestructura(): boolean {
    return this.authService.canViewInfraestructura();
  }

  canViewPortalCliente(): boolean {
    return this.authService.canViewPortalCliente();
  }
}
