import { Component, OnInit, OnDestroy, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { SidebarService } from '../../shared/services/sidebar.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-left-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './left-menu.component.html',
  styleUrls: ['./left-menu.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class LeftMenuComponent implements OnInit, OnDestroy {
  public sidebarService = inject(SidebarService);
  public authService = inject(AuthService);
  public router = inject(Router);
  menuPagosAbierto: boolean = true;
  esModoOscuro: boolean = true;
  private navSub?: Subscription;

  ngOnInit(): void {
    const savedTheme = localStorage.getItem('theme_mode');
    if (savedTheme) {
      this.esModoOscuro = savedTheme === 'dark';
    } else {
      this.esModoOscuro = true;
    }
    this.aplicarTemaBody();

    this.navSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (window.innerWidth < 768) {
        this.sidebarService.close();
      }
    });
  }

  toggleModoOscuro(): void {
    this.esModoOscuro = !this.esModoOscuro;
    localStorage.setItem('theme_mode', this.esModoOscuro ? 'dark' : 'light');
    this.aplicarTemaBody();
  }

  aplicarTemaBody(): void {
    if (this.esModoOscuro) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
      document.body.classList.remove('light-sidebar-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.add('light-sidebar-theme');
      document.body.classList.remove('dark-theme');
      document.body.classList.remove('dark-sidebar-theme');
    }
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

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
