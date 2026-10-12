import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TipoContratoService, TipoContrato } from '../../../shared/tipo-contrato/tipo-contrato.service';

@Component({
  selector: 'app-tipo-contrato-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container-fluid mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1 text-primary"><i class="bi bi-file-earmark-text-fill me-2"></i>Gestion de Tipos de Contrato</h2>
          <p class="text-muted mb-0">Modalidades contractuales y condiciones laborales para el personal</p>
        </div>
        <button class="btn btn-primary shadow-sm" (click)="abrirModalNuevo()">
          <i class="bi bi-plus-lg me-1"></i>Nuevo Contrato
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
                  placeholder="Buscar tipo de contrato por nombre o ID..."
                  [(ngModel)]="filtroTexto"
                  (input)="aplicarFiltro()"
                />
              </div>
            </div>
            <div class="col-md-6 text-md-end text-muted small">
              Mostrando {{ itemsPaginados.length }} de {{ contratosFiltrados.length }} tipos (Total: {{ contratos.length }})
            </div>
          </div>
        </div>
      </div>

      <!-- TABLA DE TIPOS DE CONTRATO -->
      <div class="card shadow-sm border-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th style="width: 80px;">ID</th>
                <th>Modalidad / Nombre de Contrato</th>
                <th class="text-end" style="width: 150px;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of itemsPaginados">
                <td><span class="badge bg-light text-dark border">#{{ c.id }}</span></td>
                <td>
                  <span class="fw-bold text-dark">{{ c.contrato }}</span>
                </td>
                <td class="text-end">
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" (click)="abrirModalEditar(c)" title="Editar">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger" (click)="eliminarContrato(c)" title="Eliminar">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="itemsPaginados.length === 0">
                <td colspan="3" class="text-center py-4 text-muted">
                  <i class="bi bi-inbox fs-2 d-block mb-2"></i>
                  No se encontraron tipos de contrato registrados.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINACION -->
        <div class="card-footer bg-white border-top d-flex justify-content-between align-items-center py-2" *ngIf="contratosFiltrados.length > pageSize">
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
                {{ editando ? 'Editar Tipo de Contrato' : 'Nuevo Tipo de Contrato' }}
              </h5>
              <button type="button" class="btn-close" (click)="cerrarModal()"></button>
            </div>
            <form (ngSubmit)="guardarContrato()">
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label fw-bold small">Nombre / Modalidad de Contrato</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="contratoActual.contrato"
                    name="nombreContrato"
                    required
                    placeholder="Ej. Tiempo Indeterminado, Determinado, Pasante, Honorarios"
                  />
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-light" (click)="cerrarModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="!contratoActual.contrato">
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
export class TipoContratoListComponent implements OnInit {
  contratos: TipoContrato[] = [];
  contratosFiltrados: TipoContrato[] = [];
  itemsPaginados: TipoContrato[] = [];

  filtroTexto: string = '';
  page: number = 1;
  pageSize: number = 10;
  totalPaginas: number = 1;
  paginasArray: number[] = [];

  mostrarModal: boolean = false;
  editando: boolean = false;
  contratoActual: TipoContrato = { contrato: '' };

  constructor(private tipoContratoService: TipoContratoService) {}

  ngOnInit(): void {
    this.cargarContratos();
  }

  cargarContratos(): void {
    this.tipoContratoService.getListTipoContratos().subscribe({
      next: (data) => {
        this.contratos = data || [];
        this.aplicarFiltro();
      },
      error: (err) => console.error('Error al cargar tipos de contratos:', err)
    });
  }

  aplicarFiltro(): void {
    const q = (this.filtroTexto || '').toLowerCase().trim();
    if (!q) {
      this.contratosFiltrados = [...this.contratos];
    } else {
      this.contratosFiltrados = this.contratos.filter(
        (c) =>
          (c.contrato && c.contrato.toLowerCase().includes(q)) ||
          (c.id && c.id.toString().includes(q))
      );
    }
    this.totalPaginas = Math.ceil(this.contratosFiltrados.length / this.pageSize) || 1;
    this.page = 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    const inicio = (this.page - 1) * this.pageSize;
    this.itemsPaginados = this.contratosFiltrados.slice(inicio, inicio + this.pageSize);
    this.paginasArray = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.page = nuevaPagina;
      this.actualizarPaginacion();
    }
  }

  abrirModalNuevo(): void {
    this.editando = false;
    this.contratoActual = { contrato: '' };
    this.mostrarModal = true;
  }

  abrirModalEditar(c: TipoContrato): void {
    this.editando = true;
    this.contratoActual = { ...c };
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
  }

  guardarContrato(): void {
    if (!this.contratoActual.contrato) return;
    if (this.editando && this.contratoActual.id) {
      this.tipoContratoService.updateTipoContrato(this.contratoActual.id, this.contratoActual).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarContratos();
        },
        error: (err) => console.error('Error al actualizar tipo contrato:', err)
      });
    } else {
      this.tipoContratoService.createTipoContrato(this.contratoActual).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarContratos();
        },
        error: (err) => console.error('Error al crear tipo contrato:', err)
      });
    }
  }

  eliminarContrato(c: TipoContrato): void {
    if (!c.id) return;
    if (confirm(`Desea eliminar el tipo de contrato "${c.contrato}"?`)) {
      this.tipoContratoService.deleteTipoContrato(c.id).subscribe({
        next: () => this.cargarContratos(),
        error: (err) => console.error('Error al eliminar tipo contrato:', err)
      });
    }
  }
}
