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
        // Si el backend (en la nube) no pudo alcanzar la IP privada pero el dispositivo tiene IP local
        if (data && !data.online && this.esIpPrivadaLocal(data.ip)) {
          this.sondeoDirectoNavegador(data).then((infoLocal) => {
            this.escaneandoId = null;
            this.dispositivoSeleccionadoInfo = infoLocal;
            this.mostrarModalInfo = true;
          });
        } else {
          this.escaneandoId = null;
          this.dispositivoSeleccionadoInfo = data;
          this.mostrarModalInfo = true;
        }
      },
      error: (err: any) => {
        // Fallback completo desde el navegador si el backend falla
        if (this.esIpPrivadaLocal(dispositivo.ip)) {
          this.sondeoDirectoNavegador({
            id: dispositivo.id,
            descripcion: dispositivo.descripcion || dispositivo.nombre,
            ip: dispositivo.ip,
            port: dispositivo.port || 80,
            online: false
          }).then((infoLocal) => {
            this.escaneandoId = null;
            this.dispositivoSeleccionadoInfo = infoLocal;
            this.mostrarModalInfo = true;
          });
        } else {
          this.escaneandoId = null;
          console.error('Error al escanear informacion del dispositivo:', err);
          this.alertModal.error('No se pudo completar el escaneo de red para este dispositivo.', 'Error de Escaneo');
        }
      }
    });
  }

  private esIpPrivadaLocal(ip: string): boolean {
    if (!ip) return false;
    return ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.16.') || ip.startsWith('172.17.') || ip.startsWith('172.18.') || ip.startsWith('172.31.');
  }

  private async sondeoDirectoNavegador(infoOriginal: any): Promise<any> {
    const ip = infoOriginal.ip;
    const port = infoOriginal.port || 80;
    const puertosAProbar = Array.from(new Set([port, 80, 443, 554, 8000, 8080, 3001, 4370]));
    const puertosAbiertos: number[] = [];
    const serviciosDetectados: { [key: string]: string } = {};
    let online = false;
    let mejorLatencia = 9999;

    const startTotal = performance.now();

    for (const p of puertosAProbar) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 750);
        const protocol = (p === 443) ? 'https' : 'http';
        const start = performance.now();

        // Sondeo HTTP fetch no bloqueante con modo no-cors
        await fetch(`${protocol}://${ip}:${p}/`, {
          mode: 'no-cors',
          cache: 'no-store',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const lat = Math.round(performance.now() - start);
        online = true;
        puertosAbiertos.push(p);
        if (lat < mejorLatencia) mejorLatencia = lat;
        serviciosDetectados[p.toString()] = this.inferirServicioWeb(p);
      } catch (err: any) {
        // En navegadores, un TypeError 'Failed to fetch' que responde rapido antes del timeout indica rechazo RST o respuesta HTTP con CORS, significando que el host existe y esta online en la red
        if (err.name !== 'AbortError') {
          const lat = Math.round(performance.now() - startTotal);
          if (lat < 600) {
            online = true;
            puertosAbiertos.push(p);
            if (lat < mejorLatencia) mejorLatencia = lat;
            serviciosDetectados[p.toString()] = this.inferirServicioWeb(p);
          }
        }
      }
    }

    if (online) {
      infoOriginal.online = true;
      infoOriginal.latenciaMs = mejorLatencia > 0 && mejorLatencia < 5000 ? mejorLatencia : 8;
      infoOriginal.fuenteEscaneo = 'Navegador Local (Computadora Cliente)';
      if (puertosAbiertos.length > 0) {
        infoOriginal.puertosAbiertos = puertosAbiertos;
        infoOriginal.serviciosDetectados = serviciosDetectados;
      }
      if (puertosAbiertos.includes(8000) || puertosAbiertos.includes(554) || (infoOriginal.descripcion && infoOriginal.descripcion.toLowerCase().includes('camara'))) {
        infoOriginal.tipoDispositivo = 'Terminal Biometrica Facial / Camara IP';
        infoOriginal.sistemaOperativo = 'Linux Embedded (HikOS)';
        infoOriginal.firmware = 'ISAPI Streaming en Red Local';
      } else if (puertosAbiertos.includes(4370)) {
        infoOriginal.tipoDispositivo = 'Lector ZKTeco';
        infoOriginal.sistemaOperativo = 'Linux Embedded (ZKOS)';
        infoOriginal.firmware = 'Protocolo Standalone 4370';
      } else if (infoOriginal.descripcion && infoOriginal.descripcion.toLowerCase().includes('gateway')) {
        infoOriginal.tipoDispositivo = 'Gateway ESP32 VNPPB';
        infoOriginal.sistemaOperativo = 'FreeRTOS';
        infoOriginal.firmware = 'Firmware ESP32 Concentrador';
      }
    }

    return infoOriginal;
  }

  private inferirServicioWeb(puerto: number): string {
    switch (puerto) {
      case 80: return 'HTTP (Panel Web de Camara / Administracion)';
      case 443: return 'HTTPS (Panel Web Seguro SSL)';
      case 554: return 'RTSP (Stream de Video en Vivo Facial)';
      case 8000: return 'SDK Hikvision / Protocolo ISAPI';
      case 3001: return 'Controlador Relay TCP';
      case 4370: return 'Protocolo ZKTeco Standalone Biometria';
      case 8080: return 'HTTP Alternativo / Microservicio';
      default: return `Servicio TCP (${puerto})`;
    }
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
