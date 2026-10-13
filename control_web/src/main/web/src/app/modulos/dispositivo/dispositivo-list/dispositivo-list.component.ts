import { Component, OnInit, OnDestroy } from '@angular/core';
import { DispositivoService } from '../../../shared/dispositivo/dispositivo.service';
import { PisoService } from '../../../shared/piso/piso.service';

@Component({
  selector: 'app-dispositivo-list',
  templateUrl: './dispositivo-list.component.html',
  styleUrls: ['./dispositivo-list.component.css']
})
export class DispositivoListComponent implements OnInit, OnDestroy {
  dispositivos: any[] = [];
  dispositivosFiltrados: any[] = [];
  itemsPaginados: any[] = [];

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

  constructor(
    private dispositivoService: DispositivoService,
    private pisoService: PisoService
  ) {}

  ngOnInit(): void {
    this.reloadData();
    this.cargarPisos();
    this.iniciarWebSocket();
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
      } catch (e) {}
    }
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
    if (!q) {
      this.dispositivosFiltrados = [...this.dispositivos];
    } else {
      this.dispositivosFiltrados = this.dispositivos.filter((d) => {
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
    }
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

  deleteDispositivo(id: number): void {
    if (confirm('Desea eliminar este dispositivo permanentemente?')) {
      this.dispositivoService.deleteDispositivo(id).subscribe({
        next: () => this.reloadData(),
        error: (err) => console.error('Error al eliminar dispositivo:', err)
      });
    }
  }

  abrirTorniquete(dispositivo: any): void {
    this.dispositivoService.abrirDispositivo(dispositivo.id).subscribe({
      next: () => {
        alert('Pulso de apertura concedido al torniquete ' + (dispositivo.descripcion || dispositivo.nombre || dispositivo.id));
      },
      error: (err) => {
        alert('Error al enviar pulso al torniquete: ' + (err.message || 'Error de conexion'));
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
        alert('No se pudo completar el escaneo de red para este dispositivo.');
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
        alert('Error al escanear la red local para descubrir dispositivos no registrados.');
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
      alert('Seleccione al menos un dispositivo para registrar.');
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
        alert('Se registraron ' + total + ' dispositivos exitosamente en la base de datos.');
        this.cerrarModalDescubrimiento();
        this.reloadData();
      },
      error: (err: any) => {
        this.guardandoLote = false;
        console.error('Error al registrar lote de dispositivos:', err);
        alert('Ocurrio un error al registrar los dispositivos seleccionados.');
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
        } catch (e) {}
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket de dispositivos no disponible:', err);
      };
    } catch (e) {}
  }
}
