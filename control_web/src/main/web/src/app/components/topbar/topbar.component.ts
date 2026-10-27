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
  public monedaActiva: 'USD' | 'EUR' = 'USD';

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

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

