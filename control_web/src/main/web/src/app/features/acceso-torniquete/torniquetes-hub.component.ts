import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BiometriaFacialComponent } from '../biometria-facial/biometria-facial.component';
import { AccesoTorniqueteComponent } from '../acceso-torniquete/acceso-torniquete.component';
import { SedeService, Sede } from '../../shared/sede/sede.service';
import { SedeStateService } from '../../shared/sede/sede-state.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-torniquetes-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, BiometriaFacialComponent, AccesoTorniqueteComponent],
  template: `
    <div class="container-fluid p-3">
      <!-- HEADER CON PESTANAS Y SELECTOR DE SEDES -->
      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h3 class="fw-bold text-dark m-0">
            <i class="bi bi-door-open-fill text-primary me-2"></i>Control de Torniquetes y Accesos
          </h3>
          <p class="text-muted small m-0">Terminal biométrico de paso y monitoreo de eventos en tiempo real</p>
        </div>

        <div class="d-flex align-items-center gap-3 flex-wrap">
          <!-- PESTANAS -->
          <ul class="nav nav-pills bg-white p-1 rounded-3 shadow-sm border m-0">
            <li class="nav-item">
              <button 
                class="nav-link fw-semibold px-3 py-2 d-flex align-items-center gap-2"
                [class.active]="tabActiva === 'terminal'"
                (click)="tabActiva = 'terminal'">
                <i class="bi bi-camera-video"></i>
                <span>Terminal Torniquetes</span>
              </button>
            </li>
            <li class="nav-item">
              <button 
                class="nav-link fw-semibold px-3 py-2 d-flex align-items-center gap-2"
                [class.active]="tabActiva === 'monitor'"
                (click)="tabActiva = 'monitor'">
                <i class="bi bi-radar text-warning"></i>
                <span>Monitor en Vivo</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- VISTA PESTANA: TERMINAL -->
      <div *ngIf="tabActiva === 'terminal'">
        <app-biometria-facial [filtroSedeId]="sedeSeleccionadaId"></app-biometria-facial>
      </div>

      <!-- VISTA PESTANA: MONITOR -->
      <div *ngIf="tabActiva === 'monitor'">
        <app-acceso-torniquete [filtroSedeId]="sedeSeleccionadaId"></app-acceso-torniquete>
      </div>
    </div>
  `,
  styles: [`
    .nav-pills .nav-link {
      color: #6c757d;
      border-radius: 6px;
      font-size: 0.9rem;
      transition: all 0.2s ease-in-out;
    }
    .nav-pills .nav-link.active {
      background-color: #0d6efd;
      color: #fff;
    }
    .nav-pills .nav-link:hover:not(.active) {
      background-color: #f8f9fa;
      color: #212529;
    }
  `]
})
export class TorniquetesHubComponent implements OnInit, OnDestroy {
  tabActiva: 'terminal' | 'monitor' = 'terminal';
  sedes: Sede[] = [];
  sedeSeleccionadaId: number | null = null;
  sedeBloqueada: boolean = false;

  private subs: Subscription[] = [];

  constructor(
    private sedeService: SedeService,
    private sedeStateService: SedeStateService
  ) {}

  ngOnInit(): void {
    this.sedeService.getListSedes().subscribe({
      next: (data) => (this.sedes = data || []),
      error: (err) => console.warn('Error cargando sedes en torniquetes-hub:', err)
    });

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

  onSedeChange(val: any): void {
    const id = val !== null && val !== undefined && val !== '' ? Number(val) : null;
    this.sedeSeleccionadaId = id;
    this.sedeStateService.seleccionarSede(id);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}

