import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { SedeStateService } from '../../../../shared/sede/sede-state.service';
import { Subscription } from 'rxjs';

export interface UserAccessEvent {
  id: string;
  name: string;
  documento?: string;
  timestamp: string;
  avatarUrl: string;
  status: 'GRANTED' | 'EXPIRED';
  planName: string;
  sedeId?: number;
}

@Component({
  selector: 'app-live-access-log',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './live-access-log.component.html',
  styleUrls: ['./live-access-log.component.scss']
})
export class LiveAccessLogComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private wsService = inject(WebSocketService);
  private sedeStateService = inject(SedeStateService);

  private sub?: Subscription;
  private sedeSub?: Subscription;

  accessLogs = signal<UserAccessEvent[]>([]);
  sedeSeleccionadaId: number | null = null;
  private todosEventos: UserAccessEvent[] = [];

  ngOnInit(): void {
    this.cargarRegistrosIniciales();

    this.sub = this.wsService.getAccesoEvents().subscribe(evento => {
      this.procesarEventoEnVivo(evento);
    });

    this.sedeSub = this.sedeStateService.sedeSeleccionadaId$.subscribe(id => {
      this.sedeSeleccionadaId = id;
      this.reaplicarFiltro();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.sedeSub?.unsubscribe();
  }

  private cargarRegistrosIniciales(): void {
    this.http.get<any[]>('/api/v1/acceso/registros').subscribe({
      next: (registros) => {
        if (!registros) return;
        // Filtrar estrictamente solo clientes que ingresaron al gimnasio
        const soloClientes = registros.filter(r => r.cliente && (r.concedido === true || r.concedido === 'true'));
        this.todosEventos = soloClientes.map((r, idx) => {
          const cli = r.cliente;
          const concedido = true;
          const fecha = r.fechaHora ? new Date(r.fechaHora) : new Date();
          const avatar = cli.foto || cli.fotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(cli.nombre || 'Cliente')}&background=0284c7&color=fff`;
          return {
            id: `reg-${r.id || idx}`,
            name: `${cli.nombre || ''} ${cli.apellido || ''}`.trim() || 'Cliente Registrado',
            documento: cli.documento || '---',
            timestamp: fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            avatarUrl: avatar,
            status: 'GRANTED' as const,
            planName: cli.membresia?.nombre || cli.estadoSuscripcion || 'Acceso Gimnasio',
            sedeId: cli.sede?.id
          };
        });
        this.reaplicarFiltro();
      },
      error: () => {}
    });
  }

  private procesarEventoEnVivo(raw: any): void {
    const concedido = raw.accesoPermitido === true || raw.resultado === 'PERMITIDO' || raw.concedido === true;
    // Solo procesar si el evento corresponde a un cliente y tiene acceso concedido
    if (!concedido) return;
    const nombre = raw.cliente || raw.nombre;
    if (!nombre || nombre.includes('Apertura de torniquete') || nombre.includes('RELE')) return;

    const sId = raw.sedeId || raw.sede_id || (raw.dispositivo?.piso?.sede?.id);
    const nuevo: UserAccessEvent = {
      id: `live-${Date.now()}`,
      name: nombre,
      documento: raw.cedula || raw.documento || '---',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatarUrl: raw.foto || raw.fotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=10b981&color=fff`,
      status: 'GRANTED',
      planName: raw.estadoMembresia || 'Check-in Exitoso',
      sedeId: sId ? Number(sId) : undefined
    };

    this.todosEventos = [nuevo, ...this.todosEventos.slice(0, 49)];
    this.reaplicarFiltro();
  }

  private reaplicarFiltro(): void {
    const filtrados = this.todosEventos.filter(e => {
      if (this.sedeSeleccionadaId === null) return true;
      if (e.sedeId === undefined) return true;
      return Number(e.sedeId) === Number(this.sedeSeleccionadaId);
    });
    this.accessLogs.set(filtrados.slice(0, 30));
  }
}
