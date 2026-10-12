import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClienteService } from '../../../shared/cliente/cliente.service';
import { Cliente } from '../../../shared/cliente/cliente.model';

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
                <th class="text-end">Acciones</th>
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
                      <small class="text-muted">{{ c.codigoInsignia || 'ID: ' + c.id }}</small>
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
                <td class="text-end">
                  <div class="btn-group btn-group-sm">
                    <a [routerLink]="['/home/cliente', c.id]" class="btn btn-outline-info" title="Ver Detalle y QR">
                      <i class="bi bi-qr-code"></i>
                    </a>
                    <a [routerLink]="['/home/cliente-edit', c.id]" class="btn btn-outline-primary" title="Editar">
                      <i class="bi bi-pencil"></i>
                    </a>
                    <button class="btn btn-outline-danger" (click)="eliminarCliente(c.id!)" title="Eliminar">
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
  `
})
export class ClienteListComponent implements OnInit {
  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  itemsPaginados: Cliente[] = [];

  filtro: string = '';
  filtroMembresia: string = '';
  page: number = 1;
  pageSize: number = 10;
  totalPaginas: number = 1;
  paginasArray: number[] = [];

  constructor(private clienteService: ClienteService) {}

  ngOnInit(): void {
    this.cargarClientes();
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
}
