import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { TasaCambioService } from '../../core/services/tasa-cambio.service';
import { SidebarService } from '../../shared/services/sidebar.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent implements OnInit {
  public branding: any = { nombreEmpresa: 'Control de Acceso' };
  public usuarioActivo: string = 'Administrador';
  public monedaActiva: 'USD' | 'EUR' = 'USD';

  constructor(
    private http: HttpClient,
    private router: Router,
    public tasaService: TasaCambioService,
    public sidebarService: SidebarService
  ) {}

  ngOnInit(): void {
    const user = localStorage.getItem('usuario_activo');
    if (user) {
      this.usuarioActivo = user;
    }

    this.http.get('/api/v1/branding/config').subscribe({
      next: (b) => this.branding = b,
      error: () => {}
    });
  }

  cerrarSesion(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('usuario_activo');
    this.router.navigate(['/login']);
  }
}
