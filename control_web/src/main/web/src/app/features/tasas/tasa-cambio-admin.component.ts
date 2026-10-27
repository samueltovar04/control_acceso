import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TasaCambioService } from '../../core/services/tasa-cambio.service';
import { AlertModalService } from '../../shared/services/alert-modal.service';

@Component({
  selector: 'app-tasa-cambio-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tasa-cambio-admin.component.html',
  styleUrls: ['./tasa-cambio-admin.component.scss']
})
export class TasaCambioAdminComponent implements OnInit {
  tasaService = inject(TasaCambioService);
  private alertModal = inject(AlertModalService);

  historicoTasas: any[] = [];
  cargandoHistorico: boolean = false;
  filtroMoneda: string = '';

  nuevaTasa = {
    moneda: 'USD' as 'USD' | 'EUR',
    tasa: null as number | null,
    fecha: new Date().toISOString().substring(0, 10),
    fuente: 'MANUAL'
  };

  guardandoManual: boolean = false;

  ngOnInit(): void {
    this.cargarHistorico();
  }

  cargarHistorico(): void {
    this.cargandoHistorico = true;
    this.tasaService.obtenerHistoricoTasas(this.filtroMoneda).subscribe({
      next: (data) => {
        this.historicoTasas = data || [];
        this.cargandoHistorico = false;
      },
      error: () => {
        this.cargandoHistorico = false;
      }
    });
  }

  registrarManual(): void {
    if (!this.nuevaTasa.tasa || this.nuevaTasa.tasa <= 0) {
      this.alertModal.warning('Ingrese un valor de tasa valido.', 'Tasa Invalida');
      return;
    }

    this.guardandoManual = true;
    this.tasaService.registrarTasaManual({
      moneda: this.nuevaTasa.moneda,
      tasa: this.nuevaTasa.tasa,
      fecha: this.nuevaTasa.fecha,
      fuente: this.nuevaTasa.fuente || 'MANUAL'
    }).subscribe({
      next: () => {
        this.guardandoManual = false;
        this.nuevaTasa.tasa = null;
        this.cargarHistorico();
      },
      error: () => {
        this.guardandoManual = false;
      }
    });
  }

  sincronizarDolarApi(moneda: 'USD' | 'EUR'): void {
    this.tasaService.sincronizarMoneda(moneda).subscribe(() => {
      this.cargarHistorico();
    });
  }
}
