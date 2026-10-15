import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebSocketService } from '../../core/services/websocket.service';
import { Subscription } from 'rxjs';

export interface EventoTorniquete {
  id?: number;
  torniquete: string;
  cliente: string;
  cedula: string;
  estadoMembresia: string;
  accesoPermitido: boolean;
  motivo?: string;
  timestamp: string;
}

@Component({
  selector: 'app-acceso-torniquete',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './acceso-torniquete.component.html',
  styleUrls: ['./acceso-torniquete.component.scss']
})
export class AccesoTorniqueteComponent implements OnInit, OnDestroy {
  private wsService = inject(WebSocketService);
  private sub?: Subscription;

  eventos = signal<EventoTorniquete[]>([]);
  totalHoy = signal<number>(0);
  permitidosHoy = signal<number>(0);
  denegadosHoy = signal<number>(0);

  ngOnInit(): void {
    this.sub = this.wsService.getAccesoEvents().subscribe(evento => {
      this.procesarEvento(evento);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private procesarEvento(raw: any): void {
    const nuevo: EventoTorniquete = {
      torniquete: raw.torniquete || 'Torniquete Principal (Entrada)',
      cliente: raw.cliente || raw.nombre || 'Desconocido',
      cedula: raw.cedula || raw.documento || 'N/A',
      estadoMembresia: raw.estadoMembresia || 'DESCONOCIDO',
      accesoPermitido: raw.accesoPermitido === true || raw.resultado === 'PERMITIDO',
      motivo: raw.motivo || (raw.accesoPermitido ? 'Membresia al dia' : 'Membresia vencida / Sin pago'),
      timestamp: new Date().toLocaleTimeString()
    };

    this.eventos.update(lista => [nuevo, ...lista.slice(0, 49)]);
    this.totalHoy.update(n => n + 1);
    if (nuevo.accesoPermitido) {
      this.permitidosHoy.update(n => n + 1);
    } else {
      this.denegadosHoy.update(n => n + 1);
    }
  }
}
