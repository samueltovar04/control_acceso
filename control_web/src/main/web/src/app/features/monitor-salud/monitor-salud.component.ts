import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SignosVitalesService, SignosVitales } from '../../core/services/signos-vitales.service';
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
  // Lista de clientes registrados en el sistema
  clientes: Cliente[] = [];
  clientesMap: Map<string, Cliente> = new Map(); // Pulsera (upper) -> Cliente
  clientesIdMap: Map<number, Cliente> = new Map(); // ClienteId -> Cliente

  // Gestion de Sedes, Pisos y Gateways
  sedes: Sede[] = [];
  filtroSedeId: number | null = null;
  sedeBloqueada: boolean = false;
  pisos: any[] = [];
  filtroPisoId: number | null = null;
  gateways: any[] = [];
  filtroGateway: string = '';

  // Tarjetas vivas por pulsera (Unica vez por cada id_pulsera, actualizadas dinamicamente)
  pulserasMap: Map<string, PulseraCard> = new Map();
  pulserasList: PulseraCard[] = [];

  // Metricas globales en tiempo real para las 4 tarjetas superiores
  resumenGlobal = {
    bpmPromedio: 0,
    spo2Promedio: 0,
    tempPromedio: 0,
    pulserasActivas: 0,
    alertasCriticas: 0
  };

  // Historial global traido desde MongoDB y enriquecido
  historialMongo: TelemetriaMongoRow[] = [];
  historialFiltrado: TelemetriaMongoRow[] = [];

  // Filtros
  filtroPulsera: string = '';
  filtroCliente: string = '';
  filtroFecha: string = '';

  // Paginacion historial
  paginaHistorial: number = 1;
  pageSizeHistorial: number = 12;

  // Modal de Historial
  mostrarModalHistorial: boolean = false;

  // Estados
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

  ngOnInit(): void {
    this.iniciarGestionSedes();
    this.cargarGateways();
    this.cargarClientes();
    this.iniciarWebSocket();
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

        // Cargar historial de MongoDB luego de conocer los clientes
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
          // Si es una consulta filtrada por fecha o pulsera, poblar la lista con los resultados de ese filtro
          this.historialMongo = nuevasFilas;
        } else {
          // Si es carga general de los ultimos 2000, unificar acumulativamente
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

  abrirModalHistorial(): void {
    this.mostrarModalHistorial = true;
    // Si hay una fecha seleccionada o pulsera buscada, traer exactamente ese conjunto de Mongo
    if (this.filtroFecha || this.filtroPulsera) {
      this.cargarHistorialMongoDB();
    } else {
      this.aplicarFiltrosLocales();
    }
  }

  cerrarModalHistorial(): void {
    this.mostrarModalHistorial = false;
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
      estado_alerta: Number(item.estado_alerta || item.alerta || 0),
      timestamp: item.timestamp || new Date().toISOString(),
      gateway_id: item.gateway_id,
      gateway_ip: item.gateway_ip,
      piso_id: item.piso_id,
      piso_numero: item.piso_numero,
      sede_id: item.sede_id,
      sede_nombre: item.sede_nombre
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
    const alerta = Number(data.estado_alerta !== undefined ? data.estado_alerta : (data.alerta ? 1 : 0));
    const timestamp = data.timestamp || new Date().toISOString();

    const gwId = data.gateway_id;
    const gwIp = data.gateway_ip;
    const pisoId = data.piso_id;
    const pisoNum = data.piso_numero;
    const sId = data.sede_id;
    const sNom = data.sede_nombre;

    // Asociar cliente (por codigoInsignia o por cliente_id enviado en telemetria)
    let clienteAsoc = this.clientesMap.get(idPulsera);
    if (!clienteAsoc && data.cliente_id) {
      clienteAsoc = this.clientesIdMap.get(Number(data.cliente_id));
    }

    const clienteNombre = clienteAsoc
      ? `${clienteAsoc.nombre} ${clienteAsoc.apellido || ''}`.trim()
      : (data.cliente_nombre || 'Sin Vincular');
    const vinculada = !!clienteAsoc;

    // ACTUALIZAR O INSERTAR LA TARJETA DE LA PULSERA (UNA SOLA POR ID_PULSERA)
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
      card.alerta = alerta;
      card.clienteNombre = clienteNombre;
      card.clienteId = clienteAsoc ? clienteAsoc.id : undefined;
      card.vinculada = vinculada;
      card.ultimoTimestamp = timestamp;
      card.online = true;
      if (gwId) card.gatewayId = gwId;
      if (gwIp) card.gatewayIp = gwIp;
      if (pisoId) card.pisoId = Number(pisoId);
      if (pisoNum) card.pisoNumero = pisoNum;
      if (sId) card.sedeId = Number(sId);
      if (sNom) card.sedeNombre = sNom;
      card.historialLocal.push(bpm);
      if (card.historialLocal.length > 10) {
        card.historialLocal.shift();
      }
    }

    this.actualizarListaTarjetas();
    this.recalcularMetricasGlobales();

    // Agregar la lectura en la tabla del historial en tiempo real
    const filaNueva: TelemetriaMongoRow = {
      id_pulsera: idPulsera,
      cliente_id: clienteAsoc ? clienteAsoc.id : undefined,
      cliente_nombre: clienteNombre,
      bpm,
      spo2,
      temp,
      estado_alerta: alerta,
      timestamp,
      gateway_id: gwId,
      gateway_ip: gwIp,
      piso_id: pisoId ? Number(pisoId) : undefined,
      piso_numero: pisoNum,
      sede_id: sId ? Number(sId) : undefined,
      sede_nombre: sNom
    };

    this.historialMongo.unshift(filaNueva);
    this.aplicarFiltros();
  }

  private actualizarListaTarjetas(): void {
    const list = Array.from(this.pulserasMap.values());
    // Filtrar tarjetas segun filtros activos, sede, piso y gateway
    this.pulserasList = list.filter(card => {
      const matchP = !this.filtroPulsera || card.idPulsera.toLowerCase().includes(this.filtroPulsera.toLowerCase());
      const matchC = !this.filtroCliente || card.clienteNombre.toLowerCase().includes(this.filtroCliente.toLowerCase());

      let matchSede = true;
      if (this.filtroSedeId !== null) {
        const cliente = card.clienteId ? this.clientesIdMap.get(card.clienteId) : this.clientesMap.get(card.idPulsera.toUpperCase());
        const sId = card.sedeId || (cliente ? (cliente.sede?.id || (cliente as any).sede_id || (cliente as any).sedeId) : null);
        matchSede = sId !== null && Number(sId) === Number(this.filtroSedeId);
      }

      let matchPiso = true;
      if (this.filtroPisoId !== null) {
        matchPiso = card.pisoId !== undefined && card.pisoId !== null && Number(card.pisoId) === Number(this.filtroPisoId);
      }

      let matchGw = true;
      if (this.filtroGateway) {
        const gwTerm = this.filtroGateway.toLowerCase();
        const cGwId = (card.gatewayId || '').toLowerCase();
        const cGwIp = (card.gatewayIp || '').toLowerCase();
        matchGw = cGwId.includes(gwTerm) || cGwIp.includes(gwTerm);
      }

      return matchP && matchC && matchSede && matchPiso && matchGw;
    });

    this.recalcularMetricasGlobales();
  }

  private recalcularMetricasGlobales(): void {
    const items = this.pulserasList;
    if (items.length === 0) {
      this.resumenGlobal = {
        bpmPromedio: 0,
        spo2Promedio: 0,
        tempPromedio: 0,
        pulserasActivas: 0,
        alertasCriticas: 0
      };
      return;
    }

    let sumaBpm = 0;
    let sumaSpo2 = 0;
    let sumaTemp = 0;
    let alertas = 0;

    items.forEach(c => {
      sumaBpm += c.bpm;
      sumaSpo2 += c.spo2;
      sumaTemp += c.temp;
      if (c.alerta === 1) alertas++;
    });

    this.resumenGlobal = {
      bpmPromedio: Math.round(sumaBpm / items.length),
      spo2Promedio: Math.round(sumaSpo2 / items.length),
      tempPromedio: Number((sumaTemp / items.length).toFixed(1)),
      pulserasActivas: items.length,
      alertasCriticas: alertas
    };
  }

  aplicarFiltros(): void {
    this.actualizarListaTarjetas();
    // Si se especifica una fecha de calendario o pulsera, consultar a MongoDB por ese día exacto
    if (this.filtroFecha) {
      this.cargarHistorialMongoDB();
    } else {
      this.aplicarFiltrosLocales();
    }
  }

  aplicarFiltrosLocales(): void {
    this.actualizarListaTarjetas();

    this.historialFiltrado = this.historialMongo.filter(h => {
      const matchPulsera = !this.filtroPulsera || h.id_pulsera.toLowerCase().includes(this.filtroPulsera.toLowerCase());
      const matchCliente = !this.filtroCliente || (h.cliente_nombre && h.cliente_nombre.toLowerCase().includes(this.filtroCliente.toLowerCase()));

      let matchFecha = true;
      if (this.filtroFecha && h.timestamp) {
        matchFecha = h.timestamp.startsWith(this.filtroFecha);
      }

      let matchSede = true;
      if (this.filtroSedeId !== null) {
        const cliente = h.cliente_id ? this.clientesIdMap.get(h.cliente_id) : this.clientesMap.get(h.id_pulsera.toUpperCase());
        const sId = h.sede_id || (cliente ? (cliente.sede?.id || (cliente as any).sede_id || (cliente as any).sedeId) : null);
        matchSede = sId !== null && Number(sId) === Number(this.filtroSedeId);
      }

      let matchPiso = true;
      if (this.filtroPisoId !== null) {
        matchPiso = h.piso_id !== undefined && h.piso_id !== null && Number(h.piso_id) === Number(this.filtroPisoId);
      }

      let matchGw = true;
      if (this.filtroGateway) {
        const gwTerm = this.filtroGateway.toLowerCase();
        const hGwId = (h.gateway_id || '').toLowerCase();
        const hGwIp = (h.gateway_ip || '').toLowerCase();
        matchGw = hGwId.includes(gwTerm) || hGwIp.includes(gwTerm);
      }

      return matchPulsera && matchCliente && matchFecha && matchSede && matchPiso && matchGw;
    });

    this.paginaHistorial = 1;
  }

  limpiarFiltros(): void {
    this.filtroPulsera = '';
    this.filtroCliente = '';
    this.filtroFecha = '';
    this.filtroPisoId = null;
    this.filtroGateway = '';
    this.aplicarFiltros();
  }

  get itemsHistorialPaginados(): TelemetriaMongoRow[] {
    const start = (this.paginaHistorial - 1) * this.pageSizeHistorial;
    return this.historialFiltrado.slice(start, start + this.pageSizeHistorial);
  }

  get totalPaginasHistorial(): number {
    return Math.ceil(this.historialFiltrado.length / this.pageSizeHistorial) || 1;
  }

  cambiarPaginaHistorial(nueva: number): void {
    if (nueva >= 1 && nueva <= this.totalPaginasHistorial) {
      this.paginaHistorial = nueva;
    }
  }

  get liveAccessFeed(): TelemetriaMongoRow[] {
    return this.historialFiltrado.slice(0, 4);
  }

  get currentActiveScan(): TelemetriaMongoRow | null {
    return this.historialFiltrado.length > 0 ? this.historialFiltrado[0] : null;
  }

  get alertsList(): TelemetriaMongoRow[] {
    return this.historialFiltrado.filter(h => h.estado_alerta === 1 || h.spo2 < 95 || h.bpm > 120).slice(0, 3);
  }

  ngOnDestroy(): void {
    if (this.wsSub) {
      this.wsSub.unsubscribe();
    }
    if (this.sedeSub) {
      this.sedeSub.unsubscribe();
    }
    if (this.sedeBloqueadaSub) {
      this.sedeBloqueadaSub.unsubscribe();
    }
  }
}
