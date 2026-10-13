import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClienteService } from '../../../shared/cliente/cliente.service';
import { Cliente } from '../../../shared/cliente/cliente.model';

interface VitalData {
  bpm: number;
  spo2: number;
  temp: number;
  alerta: number;
  timestamp?: string;
  online: boolean;
}

@Component({
  selector: 'app-cliente-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container-fluid mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1 text-primary"><i class="bi bi-people-fill me-2"></i>Gestion de Clientes & Socios</h2>
          <p class="text-muted mb-0">Control de membresias, enrolamiento biometrico dual y accesos</p>
        </div>
        <a routerLink="/home/cliente-add" class="btn btn-primary shadow-sm">
          <i class="bi bi-plus-lg me-1"></i>Nuevo Cliente
        </a>
      </div>

      <!-- FILTRO DE BUSQUEDA -->
      <div class="card shadow-sm border-0 mb-4">
        <div class="card-body p-3">
          <div class="row g-2 align-items-center">
            <div class="col-md-5">
              <div class="input-group">
                <span class="input-group-text bg-light border-end-0"><i class="bi bi-search text-muted"></i></span>
                <input
                  type="text"
                  class="form-control border-start-0 bg-light"
                  placeholder="Buscar por nombre, apellido, cedula o RFID..."
                  [(ngModel)]="filtro"
                  (input)="filtrarClientes()"
                />
              </div>
            </div>
            <div class="col-md-3">
              <select class="form-select bg-light" [(ngModel)]="filtroMembresia" (change)="filtrarClientes()">
                <option value="">Todas las membresias</option>
                <option value="ACTIVA">Activa (Permitido)</option>
                <option value="POR_VENCER">Por Vencer (Aviso)</option>
                <option value="VENCIDA">Vencida (Bloqueado)</option>
                <option value="SUSPENDIDA">Suspendida</option>
                <option value="SIN_MEMBRESIA">Sin Membresia</option>
              </select>
            </div>
            <div class="col-md-2">
              <select class="form-select bg-light" [ngModel]="pageSize" (ngModelChange)="cambiarPageSize($event)">
                <option [value]="10">10 por pag.</option>
                <option [value]="25">25 por pag.</option>
                <option [value]="50">50 por pag.</option>
              </select>
            </div>
            <div class="col-md-2 text-end text-muted small">
              Mostrando: <strong>{{ itemsPaginados.length }}</strong> de <strong>{{ clientesFiltrados.length }}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- TABLA -->
      <div class="card shadow-sm border-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>Cliente</th>
                <th>Documento</th>
                <th>Contacto</th>
                <th>Membresia</th>
                <th>Biometria Dual</th>
                <th class="text-center" style="min-width: 320px;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of itemsPaginados">
                <td>
                  <div class="d-flex align-items-center">
                    <img
                      [src]="c.foto || 'assets/images/user-placeholder.png'"
                      class="rounded-circle me-2"
                      style="width: 40px; height: 40px; object-fit: cover;"
                      onerror="this.src='https://via.placeholder.com/40'"
                    />
                    <div>
                      <div class="fw-bold">{{ c.nombre }} {{ c.apellido }}</div>
                      <div class="d-flex align-items-center gap-1">
                        <small class="text-muted">{{ c.codigoInsignia ? c.codigoInsignia : 'ID: ' + c.id }}</small>
                        <span *ngIf="c.codigoInsignia" class="badge bg-light text-primary border" style="font-size: 0.68rem;">
                          <i class="bi bi-smartwatch me-1"></i>Pulsera
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td><strong>{{ c.documento }}</strong></td>
                <td>
                  <div><small>{{ c.email || 'N/A' }}</small></div>
                  <div class="text-muted small">{{ c.telefono || '' }}</div>
                </td>
                <td>
                  <span
                    class="badge"
                    [ngClass]="{
                      'bg-success': c.estadoSuscripcion === 'ACTIVA',
                      'bg-danger': c.estadoSuscripcion === 'VENCIDA',
                      'bg-warning text-dark': c.estadoSuscripcion === 'POR_VENCER',
                      'bg-secondary': !c.estadoSuscripcion || c.estadoSuscripcion === 'SIN_MEMBRESIA' || c.estadoSuscripcion === 'SUSPENDIDA'
                    }"
                  >
                    {{ c.estadoSuscripcion || 'SIN MEMBRESIA' }}
                  </span>
                </td>
                <td>
                  <span class="badge me-1" [ngClass]="c.huella1 ? 'bg-primary' : 'bg-light text-muted border'">
                    <i class="bi bi-fingerprint me-1"></i>Huella
                  </span>
                  <span class="badge" [ngClass]="c.faceVector ? 'bg-info text-dark' : 'bg-light text-muted border'">
                    <i class="bi bi-camera-fill me-1"></i>Facial
                  </span>
                </td>
                <td class="text-center">
                  <div class="d-flex flex-wrap justify-content-center gap-1">
                    <!-- BOTON MEMBRESIA -->
                    <button
                      class="btn btn-sm btn-outline-success d-inline-flex align-items-center px-2 py-1"
                      (click)="abrirModalMembresia(c)"
                      title="Activar o Cambiar Membresia"
                    >
                      <i class="bi bi-credit-card-2-front me-1"></i>
                      <span>Membresia</span>
                    </button>

                    <!-- BOTON ASIGNAR PULSERA -->
                    <button
                      class="btn btn-sm btn-outline-info d-inline-flex align-items-center px-2 py-1"
                      (click)="abrirModalPulsera(c)"
                      title="Asignar Pulsera Biomedica IoT"
                    >
                      <i class="bi bi-smartwatch me-1"></i>
                      <span>Pulsera</span>
                    </button>

                    <!-- BOTON VER / QR -->
                    <a
                      [routerLink]="['/home/cliente', c.id]"
                      class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center px-2 py-1"
                      title="Ver Ficha y Codigo QR"
                    >
                      <i class="bi bi-qr-code me-1"></i>
                      <span>QR</span>
                    </a>

                    <!-- BOTON EDITAR -->
                    <a
                      [routerLink]="['/home/cliente-edit', c.id]"
                      class="btn btn-sm btn-outline-primary d-inline-flex align-items-center px-2 py-1"
                      title="Editar datos del Cliente"
                    >
                      <i class="bi bi-pencil me-1"></i>
                      <span>Editar</span>
                    </a>

                    <!-- BOTON ELIMINAR -->
                    <button
                      class="btn btn-sm btn-outline-danger d-inline-flex align-items-center px-2 py-1"
                      (click)="eliminarCliente(c.id!)"
                      title="Eliminar Cliente"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="itemsPaginados.length === 0">
                <td colspan="6" class="text-center py-4 text-muted">
                  <i class="bi bi-inbox fs-2 d-block mb-2"></i>
                  No se encontraron clientes registrados con los filtros seleccionados.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINACION -->
        <div class="card-footer bg-white border-top d-flex justify-content-between align-items-center py-2" *ngIf="clientesFiltrados.length > pageSize">
          <span class="small text-muted">Pagina {{ page }} de {{ totalPaginas }}</span>
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" [class.disabled]="page === 1">
              <button class="page-link" (click)="cambiarPagina(page - 1)">Anterior</button>
            </li>
            <li class="page-item" *ngFor="let p of paginasArray" [class.active]="p === page">
              <button class="page-link" (click)="cambiarPagina(p)">{{ p }}</button>
            </li>
            <li class="page-item" [class.disabled]="page === totalPaginas">
              <button class="page-link" (click)="cambiarPagina(page + 1)">Siguiente</button>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- MODAL CAMBIAR MEMBRESIA -->
    <div *ngIf="mostrarModalMembresia" class="modal-backdrop fade show" style="background: rgba(0,0,0,0.5); z-index: 1050;"></div>
    <div *ngIf="mostrarModalMembresia" class="modal fade show d-block" tabindex="-1" style="z-index: 1055;">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-light">
            <h5 class="modal-title text-primary fw-bold">
              <i class="bi bi-credit-card-2-front me-2"></i>Membresia: {{ clienteSeleccionado?.nombre }} {{ clienteSeleccionado?.apellido }}
            </h5>
            <button type="button" class="btn-close" (click)="cerrarModalMembresia()"></button>
          </div>
          <div class="modal-body p-4">
            <p class="text-muted small mb-3">
              Seleccione el nuevo estado de suscripcion para habilitar o restringir el paso por torniquetes y puertas.
            </p>

            <div class="mb-3">
              <label class="form-label fw-bold small">Estado de Membresia</label>
              <select class="form-select" [(ngModel)]="nuevoEstadoMembresia">
                <option value="ACTIVA">ACTIVA (Acceso Permitido)</option>
                <option value="POR_VENCER">POR VENCER (Notificacion en Terminal)</option>
                <option value="VENCIDA">VENCIDA (Acceso Denegado)</option>
                <option value="SUSPENDIDA">SUSPENDIDA (Temporal)</option>
                <option value="SIN_MEMBRESIA">SIN MEMBRESIA</option>
              </select>
            </div>

            <div class="alert alert-info py-2 px-3 small border-0 mb-0">
              <i class="bi bi-info-circle me-1"></i>El cambio actualiza los permisos del socio en tiempo real.
            </div>
          </div>
          <div class="modal-footer bg-light py-2">
            <button type="button" class="btn btn-secondary btn-sm" (click)="cerrarModalMembresia()">Cancelar</button>
            <button type="button" class="btn btn-success btn-sm px-3" (click)="guardarMembresia()" [disabled]="guardando">
              <i class="bi bi-check2-circle me-1"></i>Actualizar Membresia
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL ASIGNAR PULSERA Y MONITOR BIOMEDICO -->
    <div *ngIf="mostrarModalPulsera" class="modal-backdrop fade show" style="background: rgba(0,0,0,0.5); z-index: 1050;"></div>
    <div *ngIf="mostrarModalPulsera" class="modal fade show d-block" tabindex="-1" style="z-index: 1055;">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-light">
            <h5 class="modal-title text-primary fw-bold">
              <i class="bi bi-smartwatch me-2"></i>Asignar Pulsera Wearable: {{ clienteSeleccionado?.nombre }} {{ clienteSeleccionado?.apellido }}
            </h5>
            <button type="button" class="btn-close" (click)="cerrarModalPulsera()"></button>
          </div>
          <div class="modal-body p-4">
            
            <!-- INPUT DE ASIGNACION DE PULSERA -->
            <div class="row g-3 align-items-end mb-4">
              <div class="col-md-8">
                <label class="form-label fw-bold small">Numero o Identificador de Pulsera (IoT / MAC)</label>
                <div class="input-group">
                  <span class="input-group-text bg-white"><i class="bi bi-upc-scan text-muted"></i></span>
                  <input
                    type="text"
                    class="form-control"
                    placeholder="Ej. PULSERA_001, PULSERA_002, ESP32-MAC..."
                    [(ngModel)]="pulseraInput"
                    (keyup.enter)="guardarPulsera()"
                  />
                  <!-- Boton rapido de seleccion de pool activo -->
                  <button
                    class="btn btn-outline-secondary dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    Pool
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end shadow">
                    <li><h6 class="dropdown-header">Pulseras Emuladas</h6></li>
                    <li *ngFor="let p of poolEjemplos">
                      <a class="dropdown-item" href="javascript:void(0)" (click)="seleccionarPulsera(p)">{{ p }}</a>
                    </li>
                  </ul>
                </div>
                <div class="form-text small">
                  Ingresa o escanea el codigo fisico de la pulsera entregada al cliente.
                </div>
              </div>
              <div class="col-md-4 text-end">
                <button
                  type="button"
                  class="btn btn-primary w-100"
                  (click)="guardarPulsera()"
                  [disabled]="guardando"
                >
                  <i class="bi bi-link-45deg me-1"></i>Asignar / Enlazar
                </button>
              </div>
            </div>

            <!-- TARJETA EXACTA DE CONSTANTES VITALES SEGUN DISENO -->
            <div class="vital-signs-card bg-white rounded-3 p-4 shadow-sm border mb-3">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold mb-0 text-danger" style="color: #dc2626 !important; font-size: 1.25rem;">
                  Mis Constantes Vitales (Wearable)
                </h5>
                <span
                  class="badge rounded-pill"
                  [ngClass]="vitalData.online ? 'bg-success text-white' : 'bg-secondary text-white'"
                  style="font-size: 0.72rem; padding: 0.35rem 0.65rem;"
                >
                  <i class="bi bi-broadcast me-1"></i>{{ vitalData.online ? 'EN VIVO (WS)' : 'ESPERANDO PULSERA' }}
                </span>
              </div>

              <div class="row text-center g-3 pt-2">
                <!-- RITMO CARDIACO -->
                <div class="col-4 border-end">
                  <div class="text-secondary fw-semibold small mb-1" style="color: #475569 !important; font-size: 0.85rem;">
                    Ritmo Cardíaco
                  </div>
                  <div class="fw-bold display-6" style="color: #dc2626; font-size: 2.1rem; line-height: 1.1;">
                    {{ vitalData.bpm > 0 ? vitalData.bpm + ' BPM' : '-- BPM' }}
                  </div>
                </div>

                <!-- OXIGENO SPO2 -->
                <div class="col-4 border-end">
                  <div class="text-secondary fw-semibold small mb-1" style="color: #475569 !important; font-size: 0.85rem;">
                    Oxígeno SpO2
                  </div>
                  <div class="fw-bold display-6" style="color: #2563eb; font-size: 2.1rem; line-height: 1.1;">
                    {{ vitalData.spo2 > 0 ? vitalData.spo2 + '%' : '--%' }}
                  </div>
                </div>

                <!-- TEMPERATURA -->
                <div class="col-4">
                  <div class="text-secondary fw-semibold small mb-1" style="color: #475569 !important; font-size: 0.85rem;">
                    Temperatura
                  </div>
                  <div class="fw-bold display-6" style="color: #f59e0b; font-size: 2.1rem; line-height: 1.1;">
                    {{ vitalData.temp > 0 ? (vitalData.temp | number:'1.1-2') + ' °C' : '°C' }}
                  </div>
                </div>
              </div>

              <!-- ALERTA SI DESPRENDIDA O CRITICA -->
              <div *ngIf="vitalData.alerta === 1" class="alert alert-warning mt-3 py-2 px-3 small border-0 mb-0 d-flex align-items-center">
                <i class="bi bi-exclamation-triangle-fill text-warning fs-5 me-2"></i>
                <span>Atencion: El sensor reporta desprendimiento o falta de contacto directo con la piel.</span>
              </div>
            </div>

            <!-- ESTATUS DE SINCRONIZACION WEBSOCKET MOBILE -->
            <div class="d-flex align-items-center justify-content-between p-2 px-3 bg-light rounded text-muted small">
              <div>
                <i class="bi bi-phone me-1 text-primary"></i>
                <span>Transmision continua via WebSocket a Apps Mobile & Dashboards</span>
              </div>
              <div>
                <span class="badge bg-white text-dark border">
                  ID: {{ pulseraInput || 'Sin Asignar' }}
                </span>
              </div>
            </div>

          </div>
          <div class="modal-footer bg-light py-2">
            <button type="button" class="btn btn-secondary btn-sm" (click)="cerrarModalPulsera()">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .vital-signs-card {
      box-shadow: 0 4px 15px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
    }
  `]
})
export class ClienteListComponent implements OnInit, OnDestroy {
  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  itemsPaginados: Cliente[] = [];

  filtro: string = '';
  filtroMembresia: string = '';
  page: number = 1;
  pageSize: number = 10;
  totalPaginas: number = 1;
  paginasArray: number[] = [];

  // Modales
  mostrarModalMembresia: boolean = false;
  mostrarModalPulsera: boolean = false;
  clienteSeleccionado: Cliente | null = null;
  nuevoEstadoMembresia: string = 'ACTIVA';
  pulseraInput: string = '';
  guardando: boolean = false;

  poolEjemplos: string[] = ['PULSERA_001', 'PULSERA_002', 'PULSERA_003', 'PULSERA_004', 'PULSERA_005'];

  // Datos de telemetria en vivo
  vitalData: VitalData = {
    bpm: 0,
    spo2: 0,
    temp: 0,
    alerta: 0,
    online: false
  };

  private socket: WebSocket | null = null;

  constructor(private clienteService: ClienteService) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  ngOnDestroy(): void {
    this.cerrarWebSocket();
  }

  cargarClientes(): void {
    this.clienteService.getClientesList().subscribe({
      next: (data) => {
        this.clientes = data || [];
        this.filtrarClientes();
      },
      error: (err) => console.error('Error al cargar clientes:', err)
    });
  }

  filtrarClientes(): void {
    this.clientesFiltrados = this.clientes.filter((c) => {
      const matchTexto =
        !this.filtro ||
        `${c.nombre} ${c.apellido} ${c.documento} ${c.codigoInsignia || ''}`
          .toLowerCase()
          .includes(this.filtro.toLowerCase());
      const matchMembresia = !this.filtroMembresia || c.estadoSuscripcion === this.filtroMembresia;
      return matchTexto && matchMembresia;
    });

    this.totalPaginas = Math.ceil(this.clientesFiltrados.length / this.pageSize) || 1;
    this.page = 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    const inicio = (this.page - 1) * this.pageSize;
    this.itemsPaginados = this.clientesFiltrados.slice(inicio, inicio + this.pageSize);
    this.paginasArray = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.page = nuevaPagina;
      this.actualizarPaginacion();
    }
  }

  cambiarPageSize(nuevoTamano: number): void {
    this.pageSize = Number(nuevoTamano);
    this.totalPaginas = Math.ceil(this.clientesFiltrados.length / this.pageSize) || 1;
    this.page = 1;
    this.actualizarPaginacion();
  }

  eliminarCliente(id: number): void {
    if (confirm('Desea eliminar este cliente permanentemente?')) {
      this.clienteService.deleteCliente(id).subscribe({
        next: () => {
          this.clientes = this.clientes.filter((c) => c.id !== id);
          this.filtrarClientes();
        },
        error: (err) => console.error('Error al eliminar cliente:', err)
      });
    }
  }

  // ACCION MEMBRESIA
  abrirModalMembresia(c: Cliente): void {
    this.clienteSeleccionado = c;
    this.nuevoEstadoMembresia = c.estadoSuscripcion || 'ACTIVA';
    this.mostrarModalMembresia = true;
  }

  cerrarModalMembresia(): void {
    this.mostrarModalMembresia = false;
    this.clienteSeleccionado = null;
  }

  guardarMembresia(): void {
    if (!this.clienteSeleccionado || !this.clienteSeleccionado.id) return;
    this.guardando = true;
    this.clienteService.actualizarMembresia(this.clienteSeleccionado, this.nuevoEstadoMembresia).subscribe({
      next: (res) => {
        if (this.clienteSeleccionado) {
          this.clienteSeleccionado.estadoSuscripcion = this.nuevoEstadoMembresia;
        }
        this.guardando = false;
        this.cerrarModalMembresia();
        this.cargarClientes();
      },
      error: (err) => {
        console.error('Error al actualizar membresia:', err);
        this.guardando = false;
      }
    });
  }

  // ACCION ASIGNAR PULSERA
  abrirModalPulsera(c: Cliente): void {
    this.clienteSeleccionado = c;
    this.pulseraInput = c.codigoInsignia || '';
    this.vitalData = { bpm: 0, spo2: 0, temp: 0, alerta: 0, online: false };
    this.mostrarModalPulsera = true;
    this.conectarWebSocket();
  }

  seleccionarPulsera(p: string): void {
    this.pulseraInput = p;
  }

  cerrarModalPulsera(): void {
    this.mostrarModalPulsera = false;
    this.clienteSeleccionado = null;
    this.cerrarWebSocket();
  }

  guardarPulsera(): void {
    if (!this.clienteSeleccionado || !this.clienteSeleccionado.id) return;
    this.guardando = true;
    const pulsera = this.pulseraInput.trim();
    this.clienteService.asignarPulsera(this.clienteSeleccionado, pulsera).subscribe({
      next: (res) => {
        if (this.clienteSeleccionado) {
          this.clienteSeleccionado.codigoInsignia = pulsera;
        }
        this.guardando = false;
        this.cargarClientes();
      },
      error: (err) => {
        console.error('Error al asignar pulsera:', err);
        this.guardando = false;
      }
    });
  }

  // WEBSOCKET TELEMETRIA EN VIVO
  private conectarWebSocket(): void {
    this.cerrarWebSocket();
    const loc = window.location;
    const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    // Se conecta al endpoint de signos vitales (a traves del proxy nginx o directo al 8080)
    const host = (loc.port === '4200' || loc.port === '3000') ? `${loc.hostname}:8080` : loc.host;
    const wsUrl = `${protocol}//${host}/ws/signos-vitales`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        // Enlace establecido
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const idPulsera = (data.id_pulsera || data.dispositivo || data.mac || '').trim();
          const targetPulsera = (this.pulseraInput || (this.clienteSeleccionado ? this.clienteSeleccionado.codigoInsignia : '') || '').trim();

          const coincidePulsera = targetPulsera && idPulsera && idPulsera.toUpperCase() === targetPulsera.toUpperCase();
          const coincideCliente = this.clienteSeleccionado && data.cliente_id && (Number(data.cliente_id) === Number(this.clienteSeleccionado.id));

          // Si coincide o si no hay pulsera seleccionada pero se recibe telemetria de cualquier brazalete
          if (coincidePulsera || coincideCliente || (!targetPulsera && idPulsera)) {
            if (!targetPulsera && idPulsera) {
              this.pulseraInput = idPulsera;
            }
            this.vitalData = {
              bpm: data.bpm !== undefined ? Number(data.bpm) : (data.ritmocardiacoBpm || this.vitalData.bpm),
              spo2: data.spo2 !== undefined ? Number(data.spo2) : (data.saturacionOxigenoSpo2 || this.vitalData.spo2),
              temp: data.temp !== undefined ? Number(data.temp) : (data.temperatura !== undefined ? Number(data.temperatura) : (data.temperaturaCorporal || this.vitalData.temp)),
              alerta: data.alerta !== undefined ? (typeof data.alerta === 'number' ? data.alerta : (data.alerta ? 1 : 0)) : (data.estado_alerta || 0),
              timestamp: data.timestamp || new Date().toISOString(),
              online: true
            };
          }
        } catch (e) {
          // Mensaje no JSON
        }
      };

      this.socket.onclose = () => {
        this.vitalData.online = false;
      };

      this.socket.onerror = () => {
        this.vitalData.online = false;
      };
    } catch (err) {
      console.warn('No se pudo inicializar WebSocket:', err);
    }
  }

  private cerrarWebSocket(): void {
    if (this.socket) {
      try {
        this.socket.close();
      } catch (ignored) {}
      this.socket = null;
    }
  }
}
