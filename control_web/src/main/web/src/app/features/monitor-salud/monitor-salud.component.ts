import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SignosVitalesService, SignosVitales } from '../../core/services/signos-vitales.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-monitor-salud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './monitor-salud.component.html',
  styleUrls: ['./monitor-salud.component.css']
})
export class MonitorSaludComponent implements OnInit, OnDestroy {
  clienteIdBusqueda: number = 1;
  signosActuales?: SignosVitales;
  historial: SignosVitales[] = [];
  alertas: SignosVitales[] = [];
  private wsSub?: Subscription;

  constructor(
    private signosService: SignosVitalesService,
    private wsService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.cargarDatosCliente();
    this.cargarAlertas();

    // Suscripción WebSocket en tiempo real
    this.wsSub = this.wsService.getSignosVitalesEvents().subscribe(data => {
      if (data && data.cliente && data.cliente.id === this.clienteIdBusqueda) {
        this.signosActuales = data;
        this.historial.unshift(data);
      }
      if (data && data.alertaSalud) {
        this.alertas.unshift(data);
      }
    });
  }

  cargarDatosCliente(): void {
    this.signosService.getUltimoCliente(this.clienteIdBusqueda).subscribe(s => this.signosActuales = s);
    this.signosService.getHistorialCliente(this.clienteIdBusqueda).subscribe(h => this.historial = h);
  }

  cargarAlertas(): void {
    this.signosService.getAlertasActivas().subscribe(a => this.alertas = a);
  }

  ngOnDestroy(): void {
    if (this.wsSub) {
      this.wsSub.unsubscribe();
    }
  }
}
