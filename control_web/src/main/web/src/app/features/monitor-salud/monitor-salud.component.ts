import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SignosVitalesService } from '../../core/services/signos-vitales.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { ClienteService } from '../../shared/cliente/cliente.service';
import { Cliente } from '../../shared/cliente/cliente.model';
import { Subscription } from 'rxjs';

import { SedeService, Sede } from '../../shared/sede/sede.service';
import { SedeStateService } from '../../shared/sede/sede-state.service';
import { PisoService } from '../../shared/piso/piso.service';
import { DispositivoService } from '../../shared/dispositivo/dispositivo.service';

export interface PulseraCard {
  idPulsera: string;
  clienteNombre: string;
  clienteId?: number;
  vinculada: boolean;
  bpm: number;
  spo2: number;
  temp: number;
  bateria?: number;
  alerta: number;
  ultimoTimestamp: string;
  online: boolean;
  historialLocal: number[];
  gatewayId?: string;
  gatewayIp?: string;
  pisoId?: number;
  pisoNumero?: string;
  sedeId?: number;
  sedeNombre?: string;
}

export interface TelemetriaMongoRow {
  id?: string;
  id_pulsera: string;
  cliente_id?: number;
  cliente_nombre?: string;
  bpm: number;
  spo2: number;
  temp: number;
  bateria?: number;
  estado_alerta: number;
  timestamp: string;
  gateway_id?: string;
  gateway_ip?: string;
  piso_id?: number;
  piso_numero?: string;
  sede_id?: number;
  sede_nombre?: string;
}

@Component({
  selector: 'app-monitor-salud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [PisoService, DispositivoService],
  templateUrl: './monitor-salud.component.html',
  styleUrls: ['./monitor-salud.component.css']
})
export class MonitorSaludComponent implements OnInit, OnDestroy {
  clientes: Cliente[] = [];
  clientesMap: Map<string, Cliente> = new Map();
  clientesIdMap: Map<number, Cliente> = new Map();

  sedes: Sede[] = [];
  filtroSedeId: number | null = null;
  sedeBloqueada: boolean = false;
  pisos: any[] = [];
  filtroPisoId: number | null = null;
  gateways: any[] = [];
  filtroGateway: string = '';

  pulserasMap: Map<string, PulseraCard> = new Map();
  pulserasList: PulseraCard[] = [];
  pulseraSeleccionada: PulseraCard | null = null;

  seleccionarPulsera(card: PulseraCard): void {
    this.pulseraSeleccionada = card;
  }

  resumenGlobal = {
    bpmPromedio: 0,
    spo2Promedio: 0,
    tempPromedio: 0,
    pulserasActivas: 0,
    alertasCriticas: 0
  };

  historialMongo: TelemetriaMongoRow[] = [];
  historialFiltrado: TelemetriaMongoRow[] = [];

  filtroPulsera: string = '';
  filtroCliente: string = '';
  filtroFecha: string = '';

  paginaHistorial: number = 1;
  pageSizeHistorial: number = 12;

  mostrarModalHistorial: boolean = false;
  cargandoHistorial: boolean = false;
  mostrarAyudaTarjetas: boolean = false;

  private wsSub?: Subscription;
  private sedeSub?: Subscription;
  private sedeBloqueadaSub?: Subscription;

  constructor(
    private signosService: SignosVitalesService,
    private wsService: WebSocketService,
    private clienteService: ClienteService,
    private sedeService: SedeService,
    private sedeStateService: SedeStateService,
    private pisoService: PisoService,
    private dispositivoService: DispositivoService
  ) {}

  ecgSvgPath: string = '';
  ecgAreaPath: string = '';
  ecgCursorX: number = 0;
  ecgCursorY: number = 40;
  private animationFrameId: number | null = null;
  private ecgBuffer: number[] = Array(120).fill(40);
  private ecgPhase: number = 0;

  ngOnInit(): void {
    this.iniciarGestionSedes();
    this.cargarGateways();
    this.cargarClientes();
    this.iniciarWebSocket();
    this.iniciarGeneradorEcg();
  }

  iniciarGeneradorEcg(): void {
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      const activeBpm = this.pulseraSeleccionada
        ? this.pulseraSeleccionada.bpm
        : (this.resumenGlobal.bpmPromedio > 0 ? this.resumenGlobal.bpmPromedio : 72);

      const periodSec = 60 / Math.max( activeBpm, 40 );
      this.ecgPhase += dt / periodSec;
      if (this.ecgPhase >= 1) this.ecgPhase -= 1;

      let yVal = 40;
      const p = this.ecgPhase;

      if (p > 0.10 && p < 0.18) {
        yVal = 40 - Math.sin((p - 0.10) / 0.08 * Math.PI) * 4;
      } else if (p >= 0.28 && p < 0.32) {
        yVal = 40 + (p - 0.28) / 0.04 * 6;
      } else if (p >= 0.32 && p < 0.38) {
        yVal = 46 - (p - 0.32) / 0.06 * 44;
      } else if (p >= 0.38 && p < 0.44) {
        yVal = 2 + (p - 0.38) / 0.06 * 52;
      } else if (p >= 0.44 && p < 0.48) {
        yVal = 54 - (p - 0.44) / 0.04 * 14;
      } else if (p > 0.58 && p < 0.70) {
        yVal = 40 - Math.sin((p - 0.58) / 0.12 * Math.PI) * 8;
      }

      this.ecgBuffer.push(yVal);
      this.ecgBuffer.shift();

      const width = 500;
      const step = width / (this.ecgBuffer.length - 1);

      let pathD = `M 0 ${this.ecgBuffer[0].toFixed(1)}`;
      for (let i = 1; i < this.ecgBuffer.length; i++) {
        pathD += ` L ${(i * step).toFixed(1)} ${this.ecgBuffer[i].toFixed(1)}`;
      }

      this.ecgSvgPath = pathD;
      this.ecgAreaPath = `${pathD} L 500 70 L 0 70 Z`;
      this.ecgCursorX = width;
      this.ecgCursorY = this.ecgBuffer[this.ecgBuffer.length - 1];

      this.animationFrameId = requestAnimationFrame(render);
    };

    this.animationFrameId = requestAnimationFrame(render);
  }

  iniciarGestionSedes(): void {
    this.sedeService.getListSedes().subscribe({
      next: (data) => {
        this.sedes = data || [];
        this.cargarPisos();
      },
      error: (err) => console.warn('Error cargando sedes en monitor-salud:', err)
    });

    this.sedeSub = this.sedeStateService.sedeSeleccionadaId$.subscribe(id => {
      this.filtroSedeId = id;
      this.cargarPisos();
      this.aplicarFiltros();
    });

    this.sedeBloqueadaSub = this.sedeStateService.sedeBloqueada$.subscribe(bloqueada => {
      this.sedeBloqueada = bloqueada;
    });
  }

  cargarGateways(): void {
    this.dispositivoService.getDispositivosList().subscribe({
      next: (data: any[]) => {
        const todos = data || [];
        this.gateways = todos.filter(d => {
          const t = (d.tipoDispositivo || d.tipo || '').toLowerCase();
          const desc = (d.descripcion || d.nombre || '').toLowerCase();
          return t.includes('gateway') || t.includes('esp32') || desc.includes('gateway') || desc.includes('esp32') || desc.includes('vnppb');
        });
      },
      error: (err) => console.warn('Error cargando gateways en monitor-salud:', err)
    });
  }

  cargarPisos(): void {
    this.pisoService.getPisosList().subscribe({
      next: (data: any[]) => {
        const todos = data || [];
        if (this.filtroSedeId !== null) {
          this.pisos = todos.filter(p => {
            const sId = p.sede?.id || p.sede_id || p.sedeId;
            return sId !== undefined && sId !== null && Number(sId) === Number(this.filtroSedeId);
          });
        } else {
          this.pisos = todos;
        }
      },
      error: (err) => console.warn('Error cargando pisos en monitor-salud:', err)
    });
  }

  onSedeChange(val: any): void {
    const id = val !== null && val !== undefined && val !== '' ? Number(val) : null;
    this.filtroSedeId = id;
    this.filtroPisoId = null;
    this.sedeStateService.seleccionarSede(id);
    this.cargarPisos();
    this.aplicarFiltros();
  }

  onPisoChange(val: any): void {
    const id = val !== null && val !== undefined && val !== '' ? Number(val) : null;
    this.filtroPisoId = id;
    this.aplicarFiltros();
  }

  cargarClientes(): void {
    this.clienteService.getClientesList().subscribe({
      next: (data) => {
        this.clientes = data || [];
        this.clientesMap.clear();
        this.clientesIdMap.clear();

        this.clientes.forEach(c => {
          if (c.id) {
            this.clientesIdMap.set(c.id, c);
          }
          if (c.codigoInsignia) {
            this.clientesMap.set(c.codigoInsignia.trim().toUpperCase(), c);
          }
        });

        this.cargarHistorialMongoDB();
      },
      error: (err) => {
        console.error('Error cargando clientes:', err);
        this.cargarHistorialMongoDB();
      }
    });
  }

  cargarHistorialMongoDB(idPulseraFiltro?: string, fechaFiltro?: string): void {
    this.cargandoHistorial = true;
    const pulseraParam = idPulseraFiltro || this.filtroPulsera;
    const fechaParam = fechaFiltro || this.filtroFecha;

    this.signosService.getHistorialMongo(2000, pulseraParam, fechaParam).subscribe({
      next: (data) => {
        this.cargandoHistorial = false;
        const list = Array.isArray(data) ? data : [];
        const nuevasFilas = list.map(item => this.mapearFilaMongo(item));

        if (fechaParam || pulseraParam) {
          this.historialMongo = nuevasFilas;
        } else {
          const existentesMap = new Set(this.historialMongo.map(h => h.id || `${h.id_pulsera}_${h.timestamp}`));
          const filtradasParaAgregar = nuevasFilas.filter(n => !existentesMap.has(n.id || `${n.id_pulsera}_${n.timestamp}`));

          if (this.historialMongo.length === 0) {
            this.historialMongo = nuevasFilas;
          } else if (filtradasParaAgregar.length > 0) {
            this.historialMongo = [...filtradasParaAgregar, ...this.historialMongo];
          }
        }
        this.aplicarFiltrosLocales();
      },
      error: (err) => {
        this.cargandoHistorial = false;
        console.warn('Error obteniendo historial MongoDB:', err);
      }
    });
  }

  private mapearFilaMongo(item: any): TelemetriaMongoRow {
    const idPulsera = (item.id_pulsera || item.mac || 'DESCONOCIDO').trim().toUpperCase();
    const clienteAsoc = this.clientesMap.get(idPulsera);

    return {
      id: item.id || item._id,
      id_pulsera: idPulsera,
      cliente_id: clienteAsoc ? clienteAsoc.id : item.cliente_id,
      cliente_nombre: clienteAsoc
        ? `${clienteAsoc.nombre} ${clienteAsoc.apellido || ''}`.trim()
        : (item.cliente_nombre || 'Sin Vincular'),
      bpm: Number(item.bpm || 0),
      spo2: Number(item.spo2 || 0),
      temp: Number(item.temp || item.temperatura || 0),
      bateria: Number(item.bateria !== undefined && item.bateria !== null ? item.bateria : 98),
      estado_alerta: Number(item.estado_alerta || item.alerta || 0),
      timestamp: item.timestamp || new Date().toISOString(),
      gateway_id: item.gateway_id || 'GW-MESH-01',
      gateway_ip: item.gateway_ip || '192.168.1.105',
      piso_id: item.piso_id,
      piso_numero: item.piso_numero || 'Piso 2',
      sede_id: item.sede_id,
      sede_nombre: item.sede_nombre || 'Sede San Diego'
    };
  }

  private iniciarWebSocket(): void {
    this.wsSub = this.wsService.getSignosVitalesEvents().subscribe({
      next: (data) => {
        if (!data) return;
        this.procesarEventoTelemetria(data);
      },
      error: (err) => console.warn('Error en WebSocket de signos:', err)
    });
  }

  procesarEventoTelemetria(data: any): void {
    const rawId = data.id_pulsera || data.dispositivo || data.mac;
    if (!rawId) return;

    const idPulsera = String(rawId).trim().toUpperCase();
    const bpm = Number(data.bpm !== undefined ? data.bpm : (data.ritmocardiacoBpm || 0));
    const spo2 = Number(data.spo2 !== undefined ? data.spo2 : (data.saturacionOxigenoSpo2 || 0));
    const temp = Number(data.temp !== undefined ? data.temp : (data.temperatura !== undefined ? data.temperatura : (data.temperaturaCorporal || 0)));
    const bat = Number(data.bateria !== undefined && data.bateria !== null ? data.bateria : 98);
    const alerta = Number(data.estado_alerta !== undefined ? data.estado_alerta : (data.alerta ? 1 : 0));
    const timestamp = data.timestamp || new Date().toISOString();

    const gwId = data.gateway_id || 'GW-MESH-01';
    const gwIp = data.gateway_ip || '192.168.1.105';
    const pisoId = data.piso_id;
    const pisoNum = data.piso_numero || 'Piso 2';
    const sId = data.sede_id;
    const sNom = data.sede_nombre || 'Sede San Diego';

    let clienteAsoc = this.clientesMap.get(idPulsera);
    if (!clienteAsoc && data.cliente_id) {
      clienteAsoc = this.clientesIdMap.get(Number(data.cliente_id));
    }

    const clienteNombre = clienteAsoc
      ? `${clienteAsoc.nombre} ${clienteAsoc.apellido || ''}`.trim()
      : (data.cliente_nombre || 'Sin Vincular');
    const vinculada = !!clienteAsoc;

    let card = this.pulserasMap.get(idPulsera);
    if (!card) {
      card = {
        idPulsera,
        clienteNombre,
        clienteId: clienteAsoc ? clienteAsoc.id : undefined,
        vinculada,
        bpm,
        spo2,
        temp,
        bateria: bat,
        alerta,
        ultimoTimestamp: timestamp,
        online: true,
        historialLocal: [bpm],
        gatewayId: gwId,
        gatewayIp: gwIp,
        pisoId: pisoId ? Number(pisoId) : undefined,
        pisoNumero: pisoNum,
        sedeId: sId ? Number(sId) : undefined,
        sedeNombre: sNom
      };
      this.pulserasMap.set(idPulsera, card);
    } else {
      card.bpm = bpm;
      card.spo2 = spo2;
      card.temp = temp;
      card.bateria = bat;
      card.alerta = alerta;
      card.clienteNombre = clienteNombre;
      card.clienteId = clienteAsoc ? clienteAsoc.id : undefined;
      card.vinculada = vinculada;
      card.ultimoTimestamp = timestamp;
      card.gatewayId = gwId;
      card.gatewayIp = gwIp;
      card.pisoNumero = pisoNum;
      card.sedeNombre = sNom;
      card.historialLocal.push(bpm);
      if (card.historialLocal.length > 20) card.historialLocal.shift();
    }

    if (!this.pulseraSeleccionada) {
      this.pulseraSeleccionada = card;
    } else if (this.pulseraSeleccionada.idPulsera === idPulsera) {
      this.pulseraSeleccionada = card;
    }

    this.pulserasList = Array.from(this.pulserasMap.values());
    this.recalcularMetricasGlobales();

    const nuevaFila: TelemetriaMongoRow = {
      id_pulsera: idPulsera,
      cliente_id: clienteAsoc ? clienteAsoc.id : undefined,
      cliente_nombre: clienteNombre,
      bpm,
      spo2,
      temp,
      bateria: bat,
      estado_alerta: alerta,
      timestamp,
      gateway_id: gwId,
      gateway_ip: gwIp,
      piso_id: pisoId,
      piso_numero: pisoNum,
      sede_id: sId,
      sede_nombre: sNom
    };

    this.historialMongo = [nuevaFila, ...this.historialMongo];
    if (this.historialMongo.length > 2000) this.historialMongo.pop();
    this.aplicarFiltrosLocales();
  }

  recalcularMetricasGlobales(): void {
    if (this.pulserasList.length === 0) return;

    let totalBpm = 0;
    let totalSpo2 = 0;
    let totalTemp = 0;
    let alertas = 0;

    this.pulserasList.forEach(c => {
      totalBpm += c.bpm;
      totalSpo2 += c.spo2;
      totalTemp += c.temp;
      if (c.alerta === 1) alertas++;
    });

    const count = this.pulserasList.length;
    this.resumenGlobal.bpmPromedio = Math.round(totalBpm / count);
    this.resumenGlobal.spo2Promedio = Math.round(totalSpo2 / count);
    this.resumenGlobal.tempPromedio = Number((totalTemp / count).toFixed(1));
    this.resumenGlobal.pulserasActivas = count;
    this.resumenGlobal.alertasCriticas = alertas;
  }

  aplicarFiltros(): void {
    this.paginaHistorial = 1;
    this.aplicarFiltrosLocales();
  }

  aplicarFiltrosLocales(): void {
    const termPulsera = this.filtroPulsera.trim().toLowerCase();
    const termCliente = this.filtroCliente.trim().toLowerCase();
    const termGw = this.filtroGateway.trim().toLowerCase();

    this.historialFiltrado = this.historialMongo.filter(item => {
      if (termPulsera && !item.id_pulsera.toLowerCase().includes(termPulsera)) {
        return false;
      }
      if (termCliente && !(item.cliente_nombre || '').toLowerCase().includes(termCliente)) {
        return false;
      }
      if (this.filtroSedeId !== null) {
        const itemSedeId = item.sede_id;
        if (itemSedeId !== undefined && itemSedeId !== null && Number(itemSedeId) !== Number(this.filtroSedeId)) {
          return false;
        }
      }
      if (this.filtroPisoId !== null) {
        const itemPisoId = item.piso_id;
        if (itemPisoId !== undefined && itemPisoId !== null && Number(itemPisoId) !== Number(this.filtroPisoId)) {
          return false;
        }
      }
      if (termGw) {
        const matchId = (item.gateway_id || '').toLowerCase().includes(termGw);
        const matchIp = (item.gateway_ip || '').toLowerCase().includes(termGw);
        if (!matchId && !matchIp) {
          return false;
        }
      }
      return true;
    });
  }

  limpiarFiltros(): void {
    this.filtroPulsera = '';
    this.filtroCliente = '';
    this.filtroFecha = '';
    this.filtroGateway = '';
    if (!this.sedeBloqueada) {
      this.filtroSedeId = null;
    }
    this.filtroPisoId = null;
    this.cargarPisos();
    this.aplicarFiltros();
  }

  get itemsHistorialPaginados(): TelemetriaMongoRow[] {
    const start = (this.paginaHistorial - 1) * this.pageSizeHistorial;
    return this.historialFiltrado.slice(start, start + this.pageSizeHistorial);
  }

  get totalPaginasHistorial(): number {
    return Math.ceil(this.historialFiltrado.length / this.pageSizeHistorial) || 1;
  }

  cambiarPaginaHistorial(pag: number): void {
    if (pag >= 1 && pag <= this.totalPaginasHistorial) {
      this.paginaHistorial = pag;
    }
  }

  get alertsList(): TelemetriaMongoRow[] {
    return this.historialMongo.filter(h => h.estado_alerta === 1).slice(0, 5);
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
    this.sedeSub?.unsubscribe();
    this.sedeBloqueadaSub?.unsubscribe();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}
