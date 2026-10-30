import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { WebSocketService } from '../../core/services/websocket.service';
import { SedeStateService } from '../../shared/sede/sede-state.service';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface EventoTorniquete {
  id?: number | string;
  torniquete: string;
  cliente: string;
  cedula: string;
  estadoMembresia: string;
  accesoPermitido: boolean;
  motivo?: string;
  sedeId?: number;
  timestamp: string;
  epochMs?: number;
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

  private http = inject(HttpClient);
  private wsService = inject(WebSocketService);
  private sedeStateService = inject(SedeStateService);
  private sub?: Subscription;
  private sedeSub?: Subscription;

  private historialCompleto: EventoTorniquete[] = [];

  eventos = signal<EventoTorniquete[]>([]);
  totalHoy = signal<number>(0);
  permitidosHoy = signal<number>(0);
  denegadosHoy = signal<number>(0);
  cargandoHistorico = signal<boolean>(false);

  filtroBusqueda: string = '';
  filtroEstado: 'TODOS' | 'PERMITIDOS' | 'DENEGADOS' = 'TODOS';

  ngOnInit(): void {
    this.cargarHistoricoAccesos();

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

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.sedeSub?.unsubscribe();
  }

  cargarHistoricoAccesos(): void {
    this.cargandoHistorico.set(true);
    const sedeParam = this.filtroSedeId ? `&sedeId=${this.filtroSedeId}` : '';

    forkJoin({
      registros: this.http.get<any[]>('/api/v1/acceso/registros').pipe(catchError(() => of([]))),
      bitacora: this.http.get<any>(`/api/v1/acceso/bitacora?page=0&size=50${sedeParam}`).pipe(catchError(() => of({ data: [] })))
    }).subscribe(({ registros, bitacora }) => {
      const mapeadosRegistros: EventoTorniquete[] = (registros || []).map((r: any) => {
        const cliNombre = r.cliente
          ? `${r.cliente.nombre || ''} ${r.cliente.apellido || ''}`.trim()
          : r.empleado
            ? `${r.empleado.name || ''} ${r.empleado.lastName || ''}`.trim()
            : r.visita
              ? `${r.visita.name || ''} ${r.visita.lastName || ''}`.trim()
              : 'Operador / Manual';

        const doc = r.cliente?.documento || r.empleado?.document || r.visita?.document || 'N/A';
        const estadoMemb = r.cliente?.estadoSuscripcion || (r.empleado ? 'ACTIVA' : (r.concedido !== false ? 'ACTIVA' : 'VENCIDA'));
        const sId = r.cliente?.sede?.id || r.dispositivo?.piso?.sede?.id;
        const fecha = r.fechaHora ? new Date(r.fechaHora) : new Date();

        return {
          id: `reg-${r.id}`,
          torniquete: r.dispositivo?.nombre || r.dispositivo?.descripcion || 'Torniquete Principal',
          cliente: cliNombre || 'Desconocido',
          cedula: String(doc),
          estadoMembresia: String(estadoMemb).toUpperCase(),
          accesoPermitido: r.concedido !== false,
          motivo: r.motivoDenegacion || r.metodoVerificacion || (r.concedido !== false ? 'Membresia al dia' : 'Acceso denegado'),
          sedeId: sId ? Number(sId) : undefined,
          timestamp: fecha.toLocaleString(),
          epochMs: fecha.getTime()
        };
      });

      const listaBitacora: any[] = bitacora?.data || [];
      const mapeadosBitacora: EventoTorniquete[] = listaBitacora.map((b: any) => {
        const fecha = b.fechaHora ? new Date(b.fechaHora) : new Date();
        const permitido = b.concedido !== undefined ? Boolean(b.concedido) : b.tipo !== 'danger';
        return {
          id: `bit-${b.idString || fecha.getTime()}`,
          torniquete: b.dispositivoNombre || 'Torniquete Principal',
          cliente: b.personaNombre || this.extraerNombreDeMensaje(b.mensaje) || 'Usuario Terminal',
          cedula: this.extraerCedulaDeMensaje(b.mensaje) || 'N/A',
          estadoMembresia: permitido ? 'ACTIVA' : 'VENCIDA',
          accesoPermitido: permitido,
          motivo: b.mensaje || b.metodo || (permitido ? 'Acceso concedido' : 'Acceso denegado'),
          sedeId: b.sedeId ? Number(b.sedeId) : undefined,
          timestamp: fecha.toLocaleString(),
          epochMs: fecha.getTime()
        };
      });

      const combinados = [...mapeadosRegistros, ...mapeadosBitacora].sort(
        (a, b) => (b.epochMs || 0) - (a.epochMs || 0)
      );

      this.historialCompleto = combinados.slice(0, 150);
      this.cargandoHistorico.set(false);
      this.reaplicarFiltroSede();
    });
  }

  private extraerNombreDeMensaje(msg?: string): string {
    if (!msg) return '';
    const match = msg.match(/(?:identificado|identificada|Valido|Concedido):\s*([^(]+)/i);
    return match && match[1] ? match[1].trim() : '';
  }

  private extraerCedulaDeMensaje(msg?: string): string {
    if (!msg) return '';
    const match = msg.match(/Cedula:\s*([^)]+)/i);
    return match && match[1] ? match[1].trim() : '';
  }

  private procesarEvento(raw: any): void {
    const sId = raw.sedeId || raw.sede_id || (raw.dispositivo?.piso?.sede?.id) || (raw.piso?.sede?.id);
    const ahora = new Date();
    const nuevo: EventoTorniquete = {
      torniquete: raw.torniquete || 'Torniquete Principal (Entrada)',
      cliente: raw.cliente || raw.nombre || 'Desconocido',
      cedula: raw.cedula || raw.documento || 'N/A',
      estadoMembresia: raw.estadoMembresia || 'DESCONOCIDO',
      accesoPermitido: raw.accesoPermitido === true || raw.resultado === 'PERMITIDO',
      motivo: raw.motivo || (raw.accesoPermitido ? 'Membresia al dia' : 'Membresia vencida / Sin pago'),
      sedeId: sId ? Number(sId) : undefined,
      timestamp: ahora.toLocaleString(),
      epochMs: ahora.getTime()
    };

    this.historialCompleto = [nuevo, ...this.historialCompleto.slice(0, 149)];
    this.reaplicarFiltroSede();
  }

  reaplicarFiltroSede(): void {
    const porSede = this.historialCompleto.filter(ev => {
      if (this.filtroSedeId === null) return true;
      if (ev.sedeId === undefined) return true;
      return Number(ev.sedeId) === Number(this.filtroSedeId);
    });

    this.totalHoy.set(porSede.length);
    this.permitidosHoy.set(porSede.filter(e => e.accesoPermitido).length);
    this.denegadosHoy.set(porSede.filter(e => !e.accesoPermitido).length);

    const texto = this.filtroBusqueda.trim().toLowerCase();
    const filtradosVista = porSede.filter(ev => {
      if (this.filtroEstado === 'PERMITIDOS' && !ev.accesoPermitido) return false;
      if (this.filtroEstado === 'DENEGADOS' && ev.accesoPermitido) return false;
      if (!texto) return true;
      return (
        ev.cliente.toLowerCase().includes(texto) ||
        ev.cedula.toLowerCase().includes(texto) ||
        ev.torniquete.toLowerCase().includes(texto) ||
        (ev.motivo || '').toLowerCase().includes(texto)
      );
    });

    this.eventos.set(filtradosVista.slice(0, 100));
  }
}
