import { Component, OnInit, OnDestroy } from '@angular/core';
import { DispositivoService } from '../../../shared/dispositivo/dispositivo.service';
import { PisoService } from '../../../shared/piso/piso.service';
import { AlertModalService } from '../../../shared/services/alert-modal.service';
import { SedeService, Sede } from '../../../shared/sede/sede.service';
import { SedeStateService } from '../../../shared/sede/sede-state.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dispositivo-list',
  templateUrl: './dispositivo-list.component.html',
  styleUrls: ['./dispositivo-list.component.css']
})
export class DispositivoListComponent implements OnInit, OnDestroy {
  dispositivos: any[] = [];
  dispositivosFiltrados: any[] = [];
  itemsPaginados: any[] = [];

  sedesList: Sede[] = [];
  filtroSedeId: number | null = null;
  sedeBloqueada: boolean = false;

  filtroTexto: string = '';
  page: number = 1;
  pageSize: number = 10;
  totalPaginas: number = 1;
  paginasArray: number[] = [];

  cargando: boolean = false;
  escaneandoPing: boolean = false;
  escaneandoId: number | null = null;
  dispositivoSeleccionadoInfo: any = null;
  mostrarModalInfo: boolean = false;

  mostrarModalDescubrimiento: boolean = false;
  escaneandoDescubrimiento: boolean = false;
  guardandoLote: boolean = false;
  dispositivosDescubiertos: any[] = [];
  pisosDisponibles: any[] = [];
  seleccionarTodos: boolean = true;

  tiposDispositivoDisponibles: string[] = [
    'Torniquete con Relay TCP',
    'Terminal Biometrica Facial',
    'Gateway ESP32 WIFI',
    'Camara Web',
    'Camara IP',
    'Captahuellas USB Suprema',
    'Lector ZKTeco',
    'Terminal Movil',
    'Servidor de Control'
  ];

  sistemasOperativosDisponibles: string[] = [
    'Linux Embedded (ZKOS / HikOS)',
    'Android/iOS',
    'macOS/Linux 64-bit',
    'RTOS'
  ];

  private ws: WebSocket | null = null;
  private subs: Subscription[] = [];

  constructor(
    private dispositivoService: DispositivoService,
    private pisoService: PisoService,
    private sedeService: SedeService,
    private sedeStateService: SedeStateService,
    private alertModal: AlertModalService
  ) { }

  ngOnInit(): void {
    this.iniciarGestionSedes();
    this.reloadData();
    this.cargarPisos();
    this.iniciarWebSocket();
  }

  iniciarGestionSedes(): void {
    this.sedeService.getListSedes().subscribe({
      next: (sedes) => (this.sedesList = sedes || []),
      error: (err) => console.warn('Error cargando sedes en dispositivo-list:', err)
    });

    this.subs.push(
      this.sedeStateService.sedeSeleccionadaId$.subscribe(id => {
        this.filtroSedeId = id;
        this.aplicarFiltro();
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
    this.filtroSedeId = id;
    this.sedeStateService.seleccionarSede(id);
    this.aplicarFiltro();
  }

  cargarPisos(): void {
    this.pisoService.getPisosList().subscribe({
      next: (data: any) => {
        this.pisosDisponibles = data || [];
      },
      error: (err) => console.error('Error al cargar pisos:', err)
    });
  }

  ngOnDestroy(): void {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) { }
    }
    this.subs.forEach(s => s.unsubscribe());
  }

  reloadData(): void {
    this.cargando = true;
    this.dispositivoService.getDispositivosList().subscribe({
      next: (data: any) => {
        this.cargando = false;
        this.dispositivos = data || [];
        this.aplicarFiltro();
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error al cargar dispositivos:', err);
      }
    });
  }

  escanearRedPing(): void {
    this.escaneandoPing = true;
    this.dispositivoService.pingAll().subscribe({
      next: (data: any) => {
        this.escaneandoPing = false;
        if (data && Array.isArray(data)) {
          this.dispositivos = data;
          this.aplicarFiltro();
        } else {
          this.reloadData();
        }
      },
      error: (err) => {
        this.escaneandoPing = false;
        console.error('Error al escanear ping:', err);
        this.reloadData();
      }
    });
  }

  toggleEstado(dispositivo: any): void {
    const estadoPrevio = dispositivo.state;
    dispositivo.state = estadoPrevio === 1 ? 0 : 1;
    if (dispositivo.state === 0) {
      dispositivo.ping = false;
    }
    this.dispositivoService.toggleState(dispositivo.id).subscribe({
      next: (actualizado: any) => {
        if (actualizado) {
          dispositivo.state = actualizado.state;
          dispositivo.ping = actualizado.ping;
        }
      },
      error: (err) => {
        console.error('Error al alternar estado de dispositivo:', err);
        dispositivo.state = estadoPrevio;
      }
    });
  }

  aplicarFiltro(): void {
    const q = (this.filtroTexto || '').toLowerCase().trim();
    this.dispositivosFiltrados = this.dispositivos.filter((d) => {
      if (this.filtroSedeId !== null && this.filtroSedeId !== undefined) {
        const sId = d.piso?.sede?.id || d.piso?.sede_id || d.piso?.sedeId;
        if (sId !== this.filtroSedeId) {
          return false;
        }
      }
      if (!q) {
        return true;
      }
      const idStr = (d.id || '').toString();
      const desc = (d.descripcion || d.nombre || '').toLowerCase();
      const ip = (d.ip || '').toLowerCase();
      const port = (d.port || '').toString();
      const piso = (d.piso?.numeroPiso || d.piso?.descripcion || d.piso?.piso || '').toLowerCase();
      return (
        idStr.includes(q) ||
        desc.includes(q) ||
        ip.includes(q) ||
        port.includes(q) ||
        piso.includes(q)
      );
    });
    this.totalPaginas = Math.ceil(this.dispositivosFiltrados.length / this.pageSize) || 1;
    this.page = 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    const inicio = (this.page - 1) * this.pageSize;
    this.itemsPaginados = this.dispositivosFiltrados.slice(inicio, inicio + this.pageSize);
    this.paginasArray = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.page = nuevaPagina;
      this.actualizarPaginacion();
    }
  }

  async deleteDispositivo(id: number): Promise<void> {
    const confirmado = await this.alertModal.confirm(
      'Desea eliminar este dispositivo permanentemente?',
      'Eliminar Dispositivo',
      'Eliminar',
      'Cancelar'
    );
    if (confirmado) {
      this.dispositivoService.deleteDispositivo(id).subscribe({
        next: () => this.reloadData(),
        error: (err) => console.error('Error al eliminar dispositivo:', err)
      });
    }
  }

  abrirTorniquete(dispositivo: any): void {
    this.dispositivoService.abrirDispositivo(dispositivo.id).subscribe({
      next: () => {
        this.alertModal.success('Pulso de apertura concedido al torniquete ' + (dispositivo.descripcion || dispositivo.nombre || dispositivo.id), 'Torniquete Abierto');
      },
      error: (err) => {
        this.alertModal.error('Error al enviar pulso al torniquete: ' + (err.message || 'Error de conexion'), 'Error');
      }
    });
  }

  escanearInfoDispositivo(dispositivo: any): void {
    if (!dispositivo || !dispositivo.id) return;
    this.escaneandoId = dispositivo.id;
    this.dispositivoService.escanearDispositivo(dispositivo.id).subscribe({
      next: (data: any) => {
        this.escaneandoId = null;
        this.dispositivoSeleccionadoInfo = data;
        this.mostrarModalInfo = true;
      },
      error: (err: any) => {
        this.escaneandoId = null;
        console.error('Error al escanear informacion del dispositivo:', err);
        this.alertModal.error('No se pudo completar el escaneo de red para este dispositivo.', 'Error de Escaneo');
      }
    });
  }

  cerrarModalInfo(): void {
    this.mostrarModalInfo = false;
    this.dispositivoSeleccionadoInfo = null;
  }

  abrirModalDescubrimiento(): void {
    this.escaneandoDescubrimiento = true;
    this.dispositivoService.descubrirNoRegistrados().subscribe({
      next: (data: any) => {
        this.escaneandoDescubrimiento = false;
        const primerPisoId = this.pisosDisponibles.length > 0 ? this.pisosDisponibles[0].id : 1;
        this.dispositivosDescubiertos = (data || []).map((item: any) => ({
          ...item,
          seleccionado: true,
          pisoId: item.pisoId || primerPisoId,
          entradaSalida: item.entradaSalida || 0
        }));
        this.seleccionarTodos = true;
        this.mostrarModalDescubrimiento = true;
      },
      error: (err: any) => {
        this.escaneandoDescubrimiento = false;
        console.error('Error al descubrir dispositivos en red:', err);
        this.alertModal.error('Error al escanear la red local para descubrir dispositivos no registrados.', 'Error');
      }
    });
  }

  cerrarModalDescubrimiento(): void {
    this.mostrarModalDescubrimiento = false;
    this.dispositivosDescubiertos = [];
  }

  alternarSeleccionarTodos(): void {
    if (!this.dispositivosDescubiertos) return;
    for (const d of this.dispositivosDescubiertos) {
      d.seleccionado = this.seleccionarTodos;
    }
  }

  actualizarSeleccionIndividual(): void {
    this.seleccionarTodos = this.dispositivosDescubiertos.length > 0 &&
      this.dispositivosDescubiertos.every(d => d.seleccionado);
  }

  get cantidadSeleccionados(): number {
    return (this.dispositivosDescubiertos || []).filter(d => d.seleccionado).length;
  }

  registrarSeleccionadosMasivamente(): void {
    const seleccionados = (this.dispositivosDescubiertos || []).filter(d => d.seleccionado);
    if (seleccionados.length === 0) {
      this.alertModal.warning('Seleccione al menos un dispositivo para registrar.', 'Seleccion Vacia');
      return;
    }

    this.guardandoLote = true;
    const payload = seleccionados.map(d => ({
      nombre: d.descripcion || d.tipoDispositivo + ' ' + d.ip,
      descripcion: d.descripcion || d.tipoDispositivo + ' ' + d.ip,
      ip: d.ip,
      port: d.port || 3001,
      pisoId: d.pisoId ? Number(d.pisoId) : null,
      tipoDispositivo: d.tipoDispositivo || 'Torniquete con Relay TCP',
      sistemaOperativo: d.sistemaOperativo || 'Linux Embedded (ZKOS / HikOS)',
      entradaSalida: Number(d.entradaSalida) || 0,
      state: 1,
      ping: true,
      estadoConexion: true
    }));

    this.dispositivoService.registrarLote(payload).subscribe({
      next: (res: any) => {
        this.guardandoLote = false;
        const total = Array.isArray(res) ? res.length : seleccionados.length;
        this.alertModal.success('Se registraron ' + total + ' dispositivos exitosamente en la base de datos.', 'Lote Registrado');
        this.cerrarModalDescubrimiento();
        this.reloadData();
      },
      error: (err: any) => {
        this.guardandoLote = false;
        console.error('Error al registrar lote de dispositivos:', err);
        this.alertModal.error('Ocurrio un error al registrar los dispositivos seleccionados.', 'Error');
      }
    });
  }

  private iniciarWebSocket(): void {
    try {
      const protocolo = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const url = `${protocolo}//${host}/ws/dispositivos`;
      this.ws = new WebSocket(url);

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (Array.isArray(data)) {
            this.dispositivos = data;
            this.aplicarFiltro();
          }
        } catch (e) { }
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket de dispositivos no disponible:', err);
      };
    } catch (e) { }
  }
}
