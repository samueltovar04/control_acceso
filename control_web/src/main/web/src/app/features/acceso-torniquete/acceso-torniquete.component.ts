import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebSocketService } from '../../core/services/websocket.service';
import { SedeStateService } from '../../shared/sede/sede-state.service';
import { Subscription } from 'rxjs';

export interface EventoTorniquete {
  id?: number;
  torniquete: string;
  cliente: string;
  cedula: string;
  estadoMembresia: string;
  accesoPermitido: boolean;
  motivo?: string;
  sedeId?: number;
  timestamp: string;
}

@Component({
  selector: 'app-acceso-torniquete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './acceso-torniquete.component.html',
  styleUrls: ['./acceso-torniquete.component.scss']
})
export class AccesoTorniqueteComponent implements OnInit, OnDestroy, OnChanges {
  @Input() filtroSedeId: number | null = null;

  // Control de Terminal y Torniquete
  torniqueteSeleccionado: string = 'Torniquete Entrada (San Diego)';
  camaraSeleccionada: string = 'Cámara Hackvision IP (Entrada 01)';
  captahuellasSeleccionado: string = 'Futronic FS80H USB';
  autoIdentificacionActiva: boolean = true;
  abriendoManual: boolean = false;
  mensajeApertura: string = '';

  dispositivosRed = [
    { nombre: 'Torniquete Entrada', ip: '192.168.1.101', tipo: 'RELÉ ESP32', estado: 'ASIGNADO' },
    { nombre: 'Cámara Hackvision', ip: '192.168.1.102', tipo: 'VISIÓN IP', estado: 'LISTO' },
    { nombre: 'Futronic FS80H', ip: 'USB-PORT-01', tipo: 'CAPTAHUELLAS', estado: 'LISTO' }
  ];

  private wsService = inject(WebSocketService);
  private sedeStateService = inject(SedeStateService);
  private sub?: Subscription;
  private sedeSub?: Subscription;

  private historialCompleto: EventoTorniquete[] = [];

  eventos = signal<EventoTorniquete[]>([]);
  totalHoy = signal<number>(0);
  permitidosHoy = signal<number>(0);
  denegadosHoy = signal<number>(0);

  ngOnInit(): void {
    this.sub = this.wsService.getAccesoEvents().subscribe(evento => {
      this.procesarEvento(evento);
    });

    this.sedeSub = this.sedeStateService.sedeSeleccionadaId$.subscribe(id => {
      this.filtroSedeId = id;
      this.reaplicarFiltroSede();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filtroSedeId']) {
      this.reaplicarFiltroSede();
    }
  }

  abrirAperturaManual(): void {
    this.abriendoManual = true;
    this.mensajeApertura = 'Enviando pulso de apertura remota...';
    setTimeout(() => {
      this.abriendoManual = false;
      this.mensajeApertura = '✓ ¡Pulso de apertura enviado con éxito!';
      setTimeout(() => this.mensajeApertura = '', 3000);
    }, 1000);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.sedeSub?.unsubscribe();
  }

  private procesarEvento(raw: any): void {
    const sId = raw.sedeId || raw.sede_id || (raw.dispositivo?.piso?.sede?.id) || (raw.piso?.sede?.id);
    const nuevo: EventoTorniquete = {
      torniquete: raw.torniquete || 'Torniquete Principal (Entrada)',
      cliente: raw.cliente || raw.nombre || 'Desconocido',
      cedula: raw.cedula || raw.documento || 'N/A',
      estadoMembresia: raw.estadoMembresia || 'DESCONOCIDO',
      accesoPermitido: raw.accesoPermitido === true || raw.resultado === 'PERMITIDO',
      motivo: raw.motivo || (raw.accesoPermitido ? 'Membresia al dia' : 'Membresia vencida / Sin pago'),
      sedeId: sId ? Number(sId) : undefined,
      timestamp: new Date().toLocaleTimeString()
    };

    this.historialCompleto = [nuevo, ...this.historialCompleto.slice(0, 99)];
    this.reaplicarFiltroSede();
  }

  private reaplicarFiltroSede(): void {
    const filtrados = this.historialCompleto.filter(ev => {
      if (this.filtroSedeId === null) return true;
      if (ev.sedeId === undefined) return true;
      return Number(ev.sedeId) === Number(this.filtroSedeId);
    });

    this.eventos.set(filtrados.slice(0, 50));
    this.totalHoy.set(filtrados.length);
    this.permitidosHoy.set(filtrados.filter(e => e.accesoPermitido).length);
    this.denegadosHoy.set(filtrados.filter(e => !e.accesoPermitido).length);
  }
}

