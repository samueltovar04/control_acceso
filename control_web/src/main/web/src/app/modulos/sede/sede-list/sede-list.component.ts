import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SedeService, Sede } from '../../../shared/sede/sede.service';
import { AlertModalService } from '../../../shared/services/alert-modal.service';

@Component({
  selector: 'app-sede-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container-fluid mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 class="mb-1 text-primary"><i class="bi bi-geo-alt-fill me-2"></i>Gestion de Sedes</h2>
          <p class="text-muted mb-0">Administracion de edificios, sucursales y ubicaciones de control</p>
        </div>
        <button class="btn btn-primary shadow-sm" (click)="abrirModalNueva()">
          <i class="bi bi-plus-lg me-1"></i>Nueva Sede
        </button>
      </div>

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
                  placeholder="Buscar sede por nombre o ID..."
                  [(ngModel)]="filtroTexto"
                  (input)="aplicarFiltro()"
                />
              </div>
            </div>
            <div class="col-md-6 text-md-end text-muted small">
              Mostrando {{ itemsPaginados.length }} de {{ sedesFiltradas.length }} sedes (Total: {{ sedes.length }})
            </div>
          </div>
        </div>
      </div>

      <!-- TABLA DE SEDES -->
      <div class="card shadow-sm border-0">
        <div class="table-responsive d-none d-md-block">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th style="width: 80px;">ID</th>
                <th>Nombre de la Sede</th>
                <th class="text-end" style="width: 150px;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of itemsPaginados">
                <td><span class="badge bg-light text-dark border">#{{ s.id }}</span></td>
                <td>
                  <span class="fw-bold text-dark">{{ s.sede }}</span>
                </td>
                <td class="text-end">
                  <div class="d-flex flex-wrap justify-content-end gap-1">
                    <button class="btn btn-sm btn-outline-primary d-inline-flex align-items-center px-2 py-1" (click)="abrirModalEditar(s)" title="Editar">
                      <i class="bi bi-pencil me-1"></i>Editar
                    </button>
                    <button class="btn btn-sm btn-outline-danger d-inline-flex align-items-center px-2 py-1" (click)="eliminarSede(s)" title="Eliminar">
                      <i class="bi bi-trash me-1"></i>Eliminar
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="itemsPaginados.length === 0">
                <td colspan="3" class="text-center py-4 text-muted">
                  <i class="bi bi-inbox fs-2 d-block mb-2"></i>
                  No se encontraron sedes registradas.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- VISTA TARJETAS MOVIL (< 768px) -->
        <div class="d-md-none p-3 d-flex flex-column gap-3">
          <div *ngFor="let s of itemsPaginados" class="card shadow-sm border-0 rounded-3 p-3 bg-white">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div>
                <span class="badge bg-light text-dark border mb-1">#{{ s.id }}</span>
                <div class="fw-bold fs-6 text-dark">{{ s.sede }}</div>
              </div>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-primary flex-fill d-inline-flex align-items-center justify-content-center py-2" (click)="abrirModalEditar(s)">
                <i class="bi bi-pencil me-1"></i>Editar
              </button>
              <button class="btn btn-sm btn-outline-danger flex-fill d-inline-flex align-items-center justify-content-center py-2" (click)="eliminarSede(s)">
                <i class="bi bi-trash me-1"></i>Eliminar
              </button>
            </div>
          </div>
          <div *ngIf="itemsPaginados.length === 0" class="text-center py-4 text-muted">
            <i class="bi bi-inbox fs-2 d-block mb-2"></i>
            No se encontraron sedes registradas.
          </div>
        </div>

        <!-- PAGINACION -->
        <div class="card-footer bg-white border-top d-flex justify-content-between align-items-center py-2" *ngIf="sedesFiltradas.length > pageSize">
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

      <!-- MODAL FORMULARIO CREAR / EDITAR -->
      <div class="modal fade show d-block" tabindex="-1" *ngIf="mostrarModal" style="background: rgba(0,0,0,0.5);">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow">
            <div class="modal-header">
              <h5 class="modal-title fw-bold">
                <i class="bi" [ngClass]="editando ? 'bi-pencil-square' : 'bi-plus-circle'"></i>
                {{ editando ? 'Editar Sede' : 'Nueva Sede' }}
              </h5>
              <button type="button" class="btn-close" (click)="cerrarModal()"></button>
            </div>
            <form (ngSubmit)="guardarSede()">
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label fw-bold small">Nombre de la Sede</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="sedeActual.sede"
                    name="nombreSede"
                    required
                    placeholder="Ej. Sede Central, Sucursal Norte"
                  />
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-light" (click)="cerrarModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="!sedeActual.sede">
                  <i class="bi bi-save me-1"></i> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SedeListComponent implements OnInit {
  sedes: Sede[] = [];
  sedesFiltradas: Sede[] = [];
  itemsPaginados: Sede[] = [];

  filtroTexto: string = '';
  page: number = 1;
  pageSize: number = 10;
  totalPaginas: number = 1;
  paginasArray: number[] = [];

  mostrarModal: boolean = false;
  editando: boolean = false;
  sedeActual: Sede = { sede: '' };

  constructor(
    private sedeService: SedeService,
    private alertModal: AlertModalService
  ) {}

  ngOnInit(): void {
    this.cargarSedes();
  }

  cargarSedes(): void {
    this.sedeService.getListSedes().subscribe({
      next: (data) => {
        this.sedes = data || [];
        this.aplicarFiltro();
      },
      error: (err) => console.error('Error al cargar sedes:', err)
    });
  }

  aplicarFiltro(): void {
    const q = (this.filtroTexto || '').toLowerCase().trim();
    if (!q) {
      this.sedesFiltradas = [...this.sedes];
    } else {
      this.sedesFiltradas = this.sedes.filter(
        (s) =>
          (s.sede && s.sede.toLowerCase().includes(q)) ||
          (s.id && s.id.toString().includes(q))
      );
    }
    this.totalPaginas = Math.ceil(this.sedesFiltradas.length / this.pageSize) || 1;
    this.page = 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    const inicio = (this.page - 1) * this.pageSize;
    this.itemsPaginados = this.sedesFiltradas.slice(inicio, inicio + this.pageSize);
    this.paginasArray = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.page = nuevaPagina;
      this.actualizarPaginacion();
    }
  }

  abrirModalNueva(): void {
    this.editando = false;
    this.sedeActual = { sede: '' };
    this.mostrarModal = true;
  }

  abrirModalEditar(s: Sede): void {
    this.editando = true;
    this.sedeActual = { ...s };
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
  }

  guardarSede(): void {
    if (!this.sedeActual.sede) return;
    if (this.editando && this.sedeActual.id) {
      this.sedeService.updateSede(this.sedeActual.id, this.sedeActual).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarSedes();
        },
        error: (err) => console.error('Error al actualizar sede:', err)
      });
    } else {
      this.sedeService.createSede(this.sedeActual).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarSedes();
        },
        error: (err) => console.error('Error al crear sede:', err)
      });
    }
  }

  async eliminarSede(s: Sede): Promise<void> {
    if (!s.id) return;
    const confirmado = await this.alertModal.confirm(
      `Desea eliminar la sede "${s.sede}"?`,
      'Eliminar Sede',
      'Eliminar',
      'Cancelar'
    );
    if (confirmado) {
      this.sedeService.deleteSede(s.id).subscribe({
        next: () => this.cargarSedes(),
        error: (err) => console.error('Error al eliminar sede:', err)
      });
    }
  }
}
