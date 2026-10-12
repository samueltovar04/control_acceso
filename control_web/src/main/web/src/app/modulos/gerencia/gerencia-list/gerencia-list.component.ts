import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { GerenciaService, Gerencia } from '../../../shared/gerencia/gerencia.service';

@Component({
  selector: 'app-gerencia-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container-fluid mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1 text-primary"><i class="bi bi-briefcase-fill me-2"></i>Gestion de Gerencias y Departamentos</h2>
          <p class="text-muted mb-0">Estructura organizativa y areas de distribucion del personal</p>
        </div>
        <button class="btn btn-primary shadow-sm" (click)="abrirModalNueva()">
          <i class="bi bi-plus-lg me-1"></i>Nueva Gerencia
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
                  placeholder="Buscar gerencia por nombre o ID..."
                  [(ngModel)]="filtroTexto"
                  (input)="aplicarFiltro()"
                />
              </div>
            </div>
            <div class="col-md-6 text-md-end text-muted small">
              Mostrando {{ itemsPaginados.length }} de {{ gerenciasFiltradas.length }} gerencias (Total: {{ gerencias.length }})
            </div>
          </div>
        </div>
      </div>

      <!-- TABLA DE GERENCIAS -->
      <div class="card shadow-sm border-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th style="width: 80px;">ID</th>
                <th>Nombre de la Gerencia</th>
                <th class="text-end" style="width: 150px;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let g of itemsPaginados">
                <td><span class="badge bg-light text-dark border">#{{ g.id }}</span></td>
                <td>
                  <span class="fw-bold text-dark">{{ g.gerencia }}</span>
                </td>
                <td class="text-end">
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" (click)="abrirModalEditar(g)" title="Editar">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger" (click)="eliminarGerencia(g)" title="Eliminar">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="itemsPaginados.length === 0">
                <td colspan="3" class="text-center py-4 text-muted">
                  <i class="bi bi-inbox fs-2 d-block mb-2"></i>
                  No se encontraron gerencias registradas.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINACION -->
        <div class="card-footer bg-white border-top d-flex justify-content-between align-items-center py-2" *ngIf="gerenciasFiltradas.length > pageSize">
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
                {{ editando ? 'Editar Gerencia' : 'Nueva Gerencia' }}
              </h5>
              <button type="button" class="btn-close" (click)="cerrarModal()"></button>
            </div>
            <form (ngSubmit)="guardarGerencia()">
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label fw-bold small">Nombre de la Gerencia / Departamento</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="gerenciaActual.gerencia"
                    name="nombreGerencia"
                    required
                    placeholder="Ej. Recursos Humanos, Operaciones, Tecnologia"
                  />
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-light" (click)="cerrarModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="!gerenciaActual.gerencia">
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
export class GerenciaListComponent implements OnInit {
  gerencias: Gerencia[] = [];
  gerenciasFiltradas: Gerencia[] = [];
  itemsPaginados: Gerencia[] = [];

  filtroTexto: string = '';
  page: number = 1;
  pageSize: number = 10;
  totalPaginas: number = 1;
  paginasArray: number[] = [];

  mostrarModal: boolean = false;
  editando: boolean = false;
  gerenciaActual: Gerencia = { gerencia: '' };

  constructor(private gerenciaService: GerenciaService) {}

  ngOnInit(): void {
    this.cargarGerencias();
  }

  cargarGerencias(): void {
    this.gerenciaService.getListGerencias().subscribe({
      next: (data) => {
        this.gerencias = data || [];
        this.aplicarFiltro();
      },
      error: (err) => console.error('Error al cargar gerencias:', err)
    });
  }

  aplicarFiltro(): void {
    const q = (this.filtroTexto || '').toLowerCase().trim();
    if (!q) {
      this.gerenciasFiltradas = [...this.gerencias];
    } else {
      this.gerenciasFiltradas = this.gerencias.filter(
        (g) =>
          (g.gerencia && g.gerencia.toLowerCase().includes(q)) ||
          (g.id && g.id.toString().includes(q))
      );
    }
    this.totalPaginas = Math.ceil(this.gerenciasFiltradas.length / this.pageSize) || 1;
    this.page = 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    const inicio = (this.page - 1) * this.pageSize;
    this.itemsPaginados = this.gerenciasFiltradas.slice(inicio, inicio + this.pageSize);
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
    this.gerenciaActual = { gerencia: '' };
    this.mostrarModal = true;
  }

  abrirModalEditar(g: Gerencia): void {
    this.editando = true;
    this.gerenciaActual = { ...g };
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
  }

  guardarGerencia(): void {
    if (!this.gerenciaActual.gerencia) return;
    if (this.editando && this.gerenciaActual.id) {
      this.gerenciaService.updateGerencia(this.gerenciaActual.id, this.gerenciaActual).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarGerencias();
        },
        error: (err) => console.error('Error al actualizar gerencia:', err)
      });
    } else {
      this.gerenciaService.createGerencia(this.gerenciaActual).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarGerencias();
        },
        error: (err) => console.error('Error al crear gerencia:', err)
      });
    }
  }

  eliminarGerencia(g: Gerencia): void {
    if (!g.id) return;
    if (confirm(`Desea eliminar la gerencia "${g.gerencia}"?`)) {
      this.gerenciaService.deleteGerencia(g.id).subscribe({
        next: () => this.cargarGerencias(),
        error: (err) => console.error('Error al eliminar gerencia:', err)
      });
    }
  }
}
