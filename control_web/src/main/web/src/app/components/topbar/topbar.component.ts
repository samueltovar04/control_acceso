import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

import { TasaCambioService } from '../../core/services/tasa-cambio.service';
import { AuthService } from '../../core/services/auth.service';
import { SidebarService } from '../../shared/services/sidebar.service';
import { SedeStateService } from '../../shared/sede/sede-state.service';
import { Sede } from '../../shared/sede/sede.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent implements OnInit, OnDestroy {
  public branding: any = { nombreEmpresa: 'Control de Acceso' };
  public usuarioActivo: string = 'Administrador';
  public monedaActiva: 'USD' | 'EUR' | 'VES' = 'USD';

  public sedesList: Sede[] = [];
  public sedeSeleccionadaId: number | null = null;
  public sedeBloqueada: boolean = false;
  private subs: Subscription[] = [];

  constructor(
    private http: HttpClient,
    private router: Router,
    public authService: AuthService,
    public tasaService: TasaCambioService,
    public sidebarService: SidebarService,
    public sedeStateService: SedeStateService
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

    this.subs.push(
      this.sedeStateService.sedes$.subscribe(sedes => {
        this.sedesList = sedes || [];
      })
    );

    this.subs.push(
      this.sedeStateService.sedeSeleccionadaId$.subscribe(id => {
        this.sedeSeleccionadaId = id;
      })
    );

    this.subs.push(
      this.sedeStateService.sedeBloqueada$.subscribe(b => {
        this.sedeBloqueada = b;
      })
    );
  }

  onSedeChange(sedeId: any): void {
    const val = (sedeId === null || sedeId === undefined || sedeId === 'null') ? null : Number(sedeId);
    this.sedeStateService.seleccionarSede(val);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  get rolDisplay(): string {
    const user = this.authService.currentUserValue;
    if (!user || !user.role) {
      return 'usuario';
    }
    const r = user.role.toUpperCase().replace('ROLE_', '');
    switch (r) {
      case 'SUPER_ADMIN':
      case 'SUPERADMIN':
        return 'superadmin';
      case 'ADMIN':
        return 'admin';
      case 'CONTABLE':
      case 'CONTADOR':
        return 'contable';
      case 'ANALISTA':
        return 'analista';
      case 'RECEPCION':
      case 'RECEPCIONISTA':
        return 'recepcion';
      case 'SEGURIDAD':
      case 'OFICIAL':
        return 'seguridad';
      case 'OPERACION':
      case 'OPERADOR':
        return 'operador';
      case 'CLIENTE':
        return 'cliente';
      case 'EMPLEADO':
        return 'empleado';
      default:
        return r.toLowerCase();
    }
  }

  get usuarioNombre(): string {
    const u = this.authService.currentUserValue;
    if (u && u.username) {
      return u.username;
    }
    return this.usuarioActivo;
  }

  get usuarioInicial(): string {
    const name = this.usuarioNombre;
    return (name && name.length > 0) ? name.charAt(0).toUpperCase() : 'U';
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

