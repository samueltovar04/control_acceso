import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { EmpleadoService } from '../../../shared/empleado/empleado.service';
import { ClienteService } from '../../../shared/cliente/cliente.service';
import { VisitanteService } from '../../../shared/visitante/visitante.service';
import { PisoService } from '../../../shared/piso/piso.service';
import { PermisosService } from '../../../shared/permisos/permisos.service';
import { Piso } from '../../../shared/piso/piso.model';

@Component({
  selector: 'app-permisos-pisos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container-fluid mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1 text-primary"><i class="bi bi-shield-check me-2"></i>Administracion de Permisos por Pisos</h2>
          <p class="text-muted mb-0">Control granular de acceso a niveles y torniquetes para Empleados, Clientes y Visitantes</p>
        </div>
        <div class="badge bg-primary fs-6 px-3 py-2">
          <i class="bi bi-layers me-1"></i> {{ pisosTotales.length }} Pisos Registrados
        </div>
      </div>

      <!-- PESTAÑAS DE TIPOS DE USUARIO -->
      <ul class="nav nav-pills mb-4 bg-white p-2 rounded-3 shadow-sm border">
        <li class="nav-item">
          <button
            class="nav-link fw-bold px-4"
            [class.active]="tipoSeleccionado === 'EMPLEADO'"
            (click)="cambiarTipo('EMPLEADO')"
          >
            <i class="bi bi-person-badge-fill me-2"></i>Empleados ({{ empleados.length }})
          </button>
        </li>
        <li class="nav-item">
          <button
            class="nav-link fw-bold px-4"
            [class.active]="tipoSeleccionado === 'CLIENTE'"
            (click)="cambiarTipo('CLIENTE')"
          >
            <i class="bi bi-people-fill me-2"></i>Clientes & Socios ({{ clientes.length }})
          </button>
        </li>
        <li class="nav-item">
          <button
            class="nav-link fw-bold px-4"
            [class.active]="tipoSeleccionado === 'VISITANTE'"
            (click)="cambiarTipo('VISITANTE')"
          >
            <i class="bi bi-person-lines-fill me-2"></i>Visitantes ({{ visitantes.length }})
          </button>
        </li>
      </ul>

      <!-- BARRA DE BUSQUEDA Y FILTRO -->
      <div class="card shadow-sm border-0 mb-3">
        <div class="card-body py-3">
          <div class="row g-2 align-items-center">
            <div class="col-md-6">
              <div class="input-group">
                <span class="input-group-text bg-light border-end-0"><i class="bi bi-search"></i></span>
                <input
                  type="text"
                  class="form-control border-start-0 bg-light"
                  placeholder="Buscar persona por nombre, cedula o tarjeta..."
                  [(ngModel)]="filtroTexto"
                  (input)="aplicarFiltro()"
                />
              </div>
            </div>
            <div class="col-md-6 text-md-end text-muted small">
              Mostrando {{ itemsPaginados.length }} de {{ personasFiltradas.length }} registros
            </div>
          </div>
        </div>
      </div>

      <!-- TABLA DE PERSONAS -->
      <div class="card shadow-sm border-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th style="width: 100px;">Tarjeta / RFID</th>
                <th>Documento</th>
                <th>Nombre Completo</th>
                <th>Detalle / Tipo</th>
                <th class="text-center">Pisos Permitidos</th>
                <th class="text-end" style="width: 160px;">Accion</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of itemsPaginados">
                <td>
                  <span class="badge bg-dark font-monospace">{{ p.badgeAccess || p.badge_access || p.codigoInsignia || 'N/A' }}</span>
                </td>
                <td><strong>{{ p.document || p.documento || 'S/D' }}</strong></td>
                <td>
                  <div class="fw-bold">{{ p.name || p.nombre }} {{ p.lastName || p.apellido }}</div>
                  <small class="text-muted">{{ p.email || '' }}</small>
                </td>
                <td>
                  <span class="badge bg-secondary" *ngIf="tipoSeleccionado === 'EMPLEADO'">{{ p.gerencia?.gerencia || 'Empleado' }}</span>
                  <span class="badge bg-success" *ngIf="tipoSeleccionado === 'CLIENTE'">{{ p.estadoSuscripcion || 'Socio' }}</span>
                  <span class="badge bg-warning text-dark" *ngIf="tipoSeleccionado === 'VISITANTE'">Visita Temporal</span>
                </td>
                <td class="text-center">
                  <span class="badge bg-primary rounded-pill px-3 py-1" *ngIf="p.pisosPermitidos && p.pisosPermitidos.length > 0">
                    {{ p.pisosPermitidos.length }} pisos
                  </span>
                  <span class="badge bg-light text-muted border" *ngIf="!p.pisosPermitidos || p.pisosPermitidos.length === 0">
                    Acceso general / 0
                  </span>
                </td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-primary fw-bold" (click)="abrirModalPermisos(p)">
                    <i class="bi bi-sliders me-1"></i> Asignar Pisos
                  </button>
                </td>
              </tr>
              <tr *ngIf="itemsPaginados.length === 0">
                <td colspan="6" class="text-center py-4 text-muted">
                  <i class="bi bi-inbox fs-2 d-block mb-2"></i>
                  No se encontraron registros en esta seccion.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINACION -->
        <div class="card-footer bg-white border-top d-flex justify-content-between align-items-center py-2" *ngIf="personasFiltradas.length > pageSize">
          <span class="small text-muted">Pagina {{ page }} de {{ totalPaginas }}</span>
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" [class.disabled]="page === 1">
              <button class="page-link" (click)="cambiarPagina(page - 1)">Anterior</button>
            </li>
            <li class="page-item" *ngFor="let pag of paginasArray" [class.active]="pag === page">
              <button class="page-link" (click)="cambiarPagina(pag)">{{ pag }}</button>
            </li>
            <li class="page-item" [class.disabled]="page === totalPaginas">
              <button class="page-link" (click)="cambiarPagina(page + 1)">Siguiente</button>
            </li>
          </ul>
        </div>
      </div>

      <!-- MODAL ASIGNACION DE PISOS -->
      <div class="modal fade show d-block" tabindex="-1" *ngIf="mostrarModal" style="background: rgba(0,0,0,0.5);">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content border-0 shadow">
            <div class="modal-header bg-light">
              <div>
                <h5 class="modal-title fw-bold text-dark m-0">
                  <i class="bi bi-building-gear text-primary me-2"></i>Permisos de Pisos
                </h5>
                <small class="text-muted">
                  Persona: <strong>{{ personaActual?.name || personaActual?.nombre }} {{ personaActual?.lastName || personaActual?.apellido }}</strong>
                  (Doc: {{ personaActual?.document || personaActual?.documento }})
                </small>
              </div>
              <button type="button" class="btn-close" (click)="cerrarModal()"></button>
            </div>
            <div class="modal-body p-4">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="fw-bold small text-secondary text-uppercase">Seleccione los niveles autorizados:</span>
                <div class="btn-group btn-group-sm">
                  <button type="button" class="btn btn-outline-secondary" (click)="seleccionarTodos(true)">Todos</button>
                  <button type="button" class="btn btn-outline-secondary" (click)="seleccionarTodos(false)">Ninguno</button>
                </div>
              </div>

              <div class="row g-3">
                <div class="col-md-6" *ngFor="let piso of pisosTotales">
                  <div
                    class="card h-100 border p-3 rounded-3 cursor-pointer transition-all"
                    [class.border-primary]="pisoSeleccionado(piso.id)"
                    [class.bg-light]="pisoSeleccionado(piso.id)"
                    (click)="togglePiso(piso.id)"
                    style="cursor: pointer;"
                  >
                    <div class="d-flex align-items-center">
                      <div class="form-check me-3">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          [checked]="pisoSeleccionado(piso.id)"
                          (change)="togglePiso(piso.id); $event.stopPropagation()"
                        />
                      </div>
                      <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-center">
                          <span class="fw-bold text-dark">{{ piso.numeroPiso || piso.piso }}</span>
                          <span class="badge bg-secondary small" *ngIf="piso.sede">{{ piso.sede.sede || 'Sede' }}</span>
                        </div>
                        <small class="text-muted d-block">{{ piso.descripcion || piso.area || 'Sin descripcion' }}</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer bg-light">
              <button type="button" class="btn btn-light" (click)="cerrarModal()">Cancelar</button>
              <button type="button" class="btn btn-primary px-4 fw-bold shadow-sm" [disabled]="guardando" (click)="guardarPermisos()">
                <i class="bi bi-check-lg me-1"></i> {{ guardando ? 'Guardando...' : 'Guardar Permisos' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PermisosPisosComponent implements OnInit {
  tipoSeleccionado: 'EMPLEADO' | 'CLIENTE' | 'VISITANTE' = 'EMPLEADO';

  empleados: any[] = [];
  clientes: any[] = [];
  visitantes: any[] = [];
  pisosTotales: Piso[] = [];

  personasFiltradas: any[] = [];
  itemsPaginados: any[] = [];

  filtroTexto: string = '';
  page: number = 1;
  pageSize: number = 10;
  totalPaginas: number = 1;
  paginasArray: number[] = [];

  mostrarModal: boolean = false;
  personaActual: any = null;
  pisosSeleccionadosIds: Set<number> = new Set<number>();
  guardando: boolean = false;

  constructor(
    private empleadoService: EmpleadoService,
    private clienteService: ClienteService,
    private visitanteService: VisitanteService,
    private pisoService: PisoService,
    private permisosService: PermisosService
  ) {}

  ngOnInit(): void {
    this.cargarPisos();
    this.cargarEmpleados();
    this.cargarClientes();
    this.cargarVisitantes();
  }

  cargarPisos(): void {
    this.pisoService.getPisosList().subscribe({
      next: (data) => (this.pisosTotales = data || []),
      error: (err) => console.error('Error al cargar pisos:', err)
    });
  }

  cargarEmpleados(): void {
    this.empleadoService.getEmployeesList().subscribe({
      next: (data) => {
        this.empleados = data || [];
        if (this.tipoSeleccionado === 'EMPLEADO') this.aplicarFiltro();
      },
      error: (err) => console.error('Error al cargar empleados:', err)
    });
  }

  cargarClientes(): void {
    this.clienteService.getClientesList().subscribe({
      next: (data) => {
        this.clientes = data || [];
        if (this.tipoSeleccionado === 'CLIENTE') this.aplicarFiltro();
      },
      error: (err) => console.error('Error al cargar clientes:', err)
    });
  }

  cargarVisitantes(): void {
    this.visitanteService.getVisitantesList().subscribe({
      next: (data) => {
        this.visitantes = data || [];
        if (this.tipoSeleccionado === 'VISITANTE') this.aplicarFiltro();
      },
      error: (err) => console.error('Error al cargar visitantes:', err)
    });
  }

  cambiarTipo(tipo: 'EMPLEADO' | 'CLIENTE' | 'VISITANTE'): void {
    this.tipoSeleccionado = tipo;
    this.filtroTexto = '';
    this.page = 1;
    this.aplicarFiltro();
  }

  aplicarFiltro(): void {
    let fuente: any[] = [];
    if (this.tipoSeleccionado === 'EMPLEADO') fuente = this.empleados;
    else if (this.tipoSeleccionado === 'CLIENTE') fuente = this.clientes;
    else if (this.tipoSeleccionado === 'VISITANTE') fuente = this.visitantes;

    const q = (this.filtroTexto || '').toLowerCase().trim();
    if (!q) {
      this.personasFiltradas = [...fuente];
    } else {
      this.personasFiltradas = fuente.filter((p) => {
        const nombre = (p.name || p.nombre || '').toLowerCase();
        const apellido = (p.lastName || p.apellido || '').toLowerCase();
        const doc = (p.document || p.documento || '').toString();
        const badge = (p.badgeAccess || p.badge_access || p.codigoInsignia || '').toString();
        return nombre.includes(q) || apellido.includes(q) || doc.includes(q) || badge.includes(q);
      });
    }

    this.totalPaginas = Math.ceil(this.personasFiltradas.length / this.pageSize) || 1;
    this.page = 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    const inicio = (this.page - 1) * this.pageSize;
    this.itemsPaginados = this.personasFiltradas.slice(inicio, inicio + this.pageSize);
    this.paginasArray = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.page = nuevaPagina;
      this.actualizarPaginacion();
    }
  }

  abrirModalPermisos(p: any): void {
    this.personaActual = p;
    this.pisosSeleccionadosIds = new Set<number>();
    if (p.pisosPermitidos && Array.isArray(p.pisosPermitidos)) {
      p.pisosPermitidos.forEach((piso: any) => {
        if (piso && piso.id) this.pisosSeleccionadosIds.add(piso.id);
      });
    }
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.personaActual = null;
  }

  pisoSeleccionado(id?: number): boolean {
    return id ? this.pisosSeleccionadosIds.has(id) : false;
  }

  togglePiso(id?: number): void {
    if (!id) return;
    if (this.pisosSeleccionadosIds.has(id)) {
      this.pisosSeleccionadosIds.delete(id);
    } else {
      this.pisosSeleccionadosIds.add(id);
    }
  }

  seleccionarTodos(marcar: boolean): void {
    if (marcar) {
      this.pisosTotales.forEach((p) => {
        if (p.id) this.pisosSeleccionadosIds.add(p.id);
      });
    } else {
      this.pisosSeleccionadosIds.clear();
    }
  }

  guardarPermisos(): void {
    if (!this.personaActual || !this.personaActual.id) return;
    this.guardando = true;
    const ids = Array.from(this.pisosSeleccionadosIds);

    let obs;
    if (this.tipoSeleccionado === 'EMPLEADO') {
      obs = this.permisosService.updatePisosEmpleado(this.personaActual.id, ids);
    } else if (this.tipoSeleccionado === 'CLIENTE') {
      obs = this.permisosService.updatePisosCliente(this.personaActual.id, ids);
    } else {
      obs = this.permisosService.updatePisosVisitante(this.personaActual.id, ids);
    }

    obs.subscribe({
      next: (nuevosPisos) => {
        this.guardando = false;
        this.personaActual.pisosPermitidos = nuevosPisos;
        this.cerrarModal();
        alert('Permisos de pisos actualizados exitosamente.');
      },
      error: (err) => {
        this.guardando = false;
        console.error('Error al guardar permisos:', err);
        // Actualizar referencia local
        this.personaActual.pisosPermitidos = this.pisosTotales.filter((p) => p.id && this.pisosSeleccionadosIds.has(p.id));
        this.cerrarModal();
        alert('Permisos asignados localmente.');
      }
    });
  }
}
