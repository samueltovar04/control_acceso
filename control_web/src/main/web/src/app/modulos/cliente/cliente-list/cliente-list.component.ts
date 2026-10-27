import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ClienteService } from '../../../shared/cliente/cliente.service';
import { Cliente } from '../../../shared/cliente/cliente.model';
import { BcvConvertPipe } from '../../../shared/pipes/bcv-convert.pipe';
import { AlertModalService } from '../../../shared/services/alert-modal.service';
import { SedeStateService } from '../../../shared/sede/sede-state.service';
import { Subscription } from 'rxjs';

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
  imports: [CommonModule, RouterModule, FormsModule, BcvConvertPipe],
  template: `
    <div class="container-fluid mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
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

      <!-- VISTA TABLA (DESKTOP >= 768px) -->
      <div class="card shadow-sm border-0 d-none d-md-block">
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
                  <span class="badge me-1" [ngClass]="c.faceVector ? 'bg-info text-dark' : 'bg-light text-muted border'">
                    <i class="bi bi-camera-fill me-1"></i>Facial
                  </span>
                  <span class="badge" [ngClass]="c.sesionMovilActiva !== false ? 'bg-success text-white' : 'bg-secondary text-white'">
                    <i class="bi bi-phone me-1"></i>{{ c.sesionMovilActiva !== false ? 'App Activa' : 'App Inactiva' }}
                  </span>
                </td>
                <td class="text-center">
                  <div class="d-flex flex-wrap justify-content-center gap-1">
                    <button
                      class="btn btn-sm btn-outline-success d-inline-flex align-items-center px-2 py-1"
                      (click)="abrirModalMembresia(c)"
                      title="Activar o Cambiar Membresia"
                    >
                      <i class="bi bi-credit-card-2-front me-1"></i>
                      <span>Membresia</span>
                    </button>
                    <button
                      class="btn btn-sm btn-outline-warning d-inline-flex align-items-center px-2 py-1"
                      (click)="cerrarSesionMovil(c)"
                      [title]="c.sesionMovilActiva !== false ? 'Cerrar Sesión Móvil del Cliente' : 'Sesión Móvil Inactiva'"
                    >
                      <i class="bi bi-phone-vibrate me-1"></i>
                      <span>{{ c.sesionMovilActiva !== false ? 'Cerrar App' : 'App Inactiva' }}</span>
                    </button>
                    <button
                      class="btn btn-sm btn-outline-info d-inline-flex align-items-center px-2 py-1"
                      (click)="abrirModalPulsera(c)"
                      title="Asignar Pulsera Biomedica IoT"
                    >
                      <i class="bi bi-smartwatch me-1"></i>
                      <span>Pulsera</span>
                    </button>
                    <a
                      [routerLink]="['/home/cliente', c.id]"
                      class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center px-2 py-1"
                      title="Ver Ficha y Codigo QR"
                    >
                      <i class="bi bi-qr-code me-1"></i>
                      <span>QR</span>
                    </a>
                    <a
                      [routerLink]="['/home/cliente-edit', c.id]"
                      class="btn btn-sm btn-outline-primary d-inline-flex align-items-center px-2 py-1"
                      title="Editar datos del Cliente"
                    >
                      <i class="bi bi-pencil me-1"></i>
                      <span>Editar</span>
                    </a>
                    <button
                      class="btn btn-sm btn-outline-danger d-inline-flex align-items-center px-2 py-1"
                      (click)="eliminarCliente(c.id!)"
                      title="Eliminar Cliente"
                    >
                      <i class="bi bi-trash me-1"></i>
                      <span>Eliminar</span>
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
      </div>

      <!-- VISTA TARJETAS RESPONSIVAS (MOVIL < 768px) -->
      <div class="d-md-none d-flex flex-column gap-3">
        <div *ngFor="let c of itemsPaginados" class="card shadow-sm border-0 rounded-3 p-3 bg-white">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <div class="d-flex align-items-center">
              <img
                [src]="c.foto || 'assets/images/user-placeholder.png'"
                class="rounded-circle me-2 border"
                style="width: 44px; height: 44px; object-fit: cover;"
                onerror="this.src='https://via.placeholder.com/44'"
              />
              <div>
                <div class="fw-bold text-dark fs-6">{{ c.nombre }} {{ c.apellido }}</div>
                <div class="d-flex align-items-center gap-1">
                  <small class="text-muted fw-bold">DOC: {{ c.documento }}</small>
                </div>
              </div>
            </div>
            <span *ngIf="c.codigoInsignia" class="badge bg-light text-primary border" style="font-size: 0.7rem;">
              <i class="bi bi-smartwatch me-1"></i>Pulsera
            </span>
          </div>

          <div class="bg-light rounded p-2 mb-3 small">
            <div class="d-flex justify-content-between align-items-center py-1 border-bottom border-white">
              <span class="text-muted">Contacto:</span>
              <span class="text-dark text-truncate text-end ms-2" style="max-width: 200px;">
                {{ c.telefono ? c.telefono : (c.email || 'Sin contacto') }}
              </span>
            </div>
            <div class="d-flex justify-content-between align-items-center py-1 border-bottom border-white">
              <span class="text-muted">Membresía:</span>
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
            </div>
            <div class="d-flex justify-content-between align-items-center pt-1">
              <span class="text-muted">Biometría:</span>
              <div>
                <span class="badge me-1" [ngClass]="c.huella1 ? 'bg-primary' : 'bg-light text-muted border'">
                  <i class="bi bi-fingerprint me-1"></i>Huella
                </span>
                <span class="badge" [ngClass]="c.faceVector ? 'bg-info text-dark' : 'bg-light text-muted border'">
                  <i class="bi bi-camera-fill me-1"></i>Facial
                </span>
              </div>
            </div>
          </div>

          <!-- BOTONES DE ACCION MÓVIL FULL-WIDTH -->
          <div class="d-flex flex-wrap gap-1">
            <button
              class="btn btn-sm btn-outline-success flex-fill d-inline-flex align-items-center justify-content-center py-1 px-2"
              (click)="abrirModalMembresia(c)"
              title="Activar o Cambiar Membresia"
            >
              <i class="bi bi-credit-card-2-front me-1"></i>
              <span>Membresía</span>
            </button>
            <button
              class="btn btn-sm btn-outline-info flex-fill d-inline-flex align-items-center justify-content-center py-1 px-2"
              (click)="abrirModalPulsera(c)"
              title="Asignar Pulsera"
            >
              <i class="bi bi-smartwatch me-1"></i>
              <span>Pulsera</span>
            </button>
            <a
              [routerLink]="['/home/cliente', c.id]"
              class="btn btn-sm btn-outline-secondary flex-fill d-inline-flex align-items-center justify-content-center py-1 px-2"
              title="Ver Ficha y QR"
            >
              <i class="bi bi-qr-code me-1"></i>
              <span>QR</span>
            </a>
            <a
              [routerLink]="['/home/cliente-edit', c.id]"
              class="btn btn-sm btn-outline-primary flex-fill d-inline-flex align-items-center justify-content-center py-1 px-2"
              title="Editar Cliente"
            >
              <i class="bi bi-pencil me-1"></i>
              <span>Editar</span>
            </a>
            <button
              class="btn btn-sm btn-outline-danger flex-fill d-inline-flex align-items-center justify-content-center py-1 px-2"
              (click)="eliminarCliente(c.id!)"
              title="Eliminar Cliente"
            >
              <i class="bi bi-trash me-1"></i>
              <span>Eliminar</span>
            </button>
          </div>
        </div>

        <div *ngIf="itemsPaginados.length === 0" class="card p-4 text-center text-muted border-0 shadow-sm">
          <i class="bi bi-inbox fs-2 d-block mb-2"></i>
          No se encontraron clientes registrados con los filtros seleccionados.
        </div>
      </div>

      <!-- PAGINACION COMPARTIDA -->
      <div class="card shadow-sm border-0 mt-3" *ngIf="clientesFiltrados.length > pageSize">
        <div class="card-body p-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span class="small text-muted">Página {{ page }} de {{ totalPaginas }}</span>
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" [class.disabled]="page === 1">
              <button class="page-link" (click)="cambiarPagina(page - 1)">Ant</button>
            </li>
            <li class="page-item" *ngFor="let pag of paginasArray" [class.active]="pag === page">
              <button class="page-link" (click)="cambiarPagina(pag)">{{ pag }}</button>
            </li>
            <li class="page-item" [class.disabled]="page === totalPaginas">
              <button class="page-link" (click)="cambiarPagina(page + 1)">Sig</button>
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
              Seleccione el plan de membresia del catalogo y el estado de suscripcion para habilitar o restringir el paso por torniquetes.
            </p>

            <div class="mb-3">
              <label class="form-label fw-bold small text-primary"><i class="bi bi-card-checklist me-1"></i>Plan de Membresia *</label>
              <select class="form-select border-primary" [(ngModel)]="membresiaModalId" (ngModelChange)="onMembresiaModalChange()">
                <option [ngValue]="null">Sin Membresia Asignada</option>
                <option *ngFor="let m of catalogoMembresias" [value]="m.id">
                  {{ m.nombre }} - $ {{ m.precio }} / {{ m.precio | bcvConvert:'USD' }} ({{ m.ciclo || m.periodicidad }} • {{ m.duracionDias || m.duracionesDias }} dias)
                </option>
              </select>
              <div *ngIf="membresiaModalSeleccionada" class="form-text text-success fw-semibold small mt-1">
                <i class="bi bi-currency-exchange me-1"></i>Precio Base: $ {{ membresiaModalSeleccionada.precio }} ({{ membresiaModalSeleccionada.precio | bcvConvert:'USD' }})
              </div>
            </div>

            <!-- SELECTOR DE CUPON O PROMOCION -->
            <div class="mb-3" *ngIf="membresiaModalId">
              <label class="form-label fw-bold small text-success">
                <i class="bi bi-tag-fill me-1"></i>Aplicar Cupon o Promocion (Opcional)
              </label>
              <select class="form-select border-success" [(ngModel)]="cuponSeleccionadoCodigo">
                <option value="">Sin promocion / Precio Regular</option>
                <option *ngFor="let promo of promocionesFiltradas" [value]="promo.codigo">
                  {{ promo.nombre }} [Codigo: {{ promo.codigo }}] — {{ promo.tipoDescuento }}: {{ promo.valorDescuento }}{{ promo.tipoDescuento === 'PORCENTAJE' ? '%' : (promo.tipoDescuento === 'MONTO_FIJO' ? '$' : '') }}
                </option>
              </select>
              <div *ngIf="promocionModalSeleccionada" class="form-text text-primary small fw-semibold mt-1">
                <i class="bi bi-stars me-1"></i>{{ precioFinalConDescuento.etiqueta }}
              </div>
            </div>

            <!-- METODO DE PAGO GENERADO -->
            <div class="mb-3" *ngIf="membresiaModalId">
              <label class="form-label fw-bold small text-secondary">
                <i class="bi bi-cash-stack me-1"></i>Metodo de Pago
              </label>
              <select class="form-select" [(ngModel)]="metodoPagoSeleccionado">
                <option value="EFECTIVO">Efectivo (Caja Recepcion)</option>
                <option value="PAGO_MOVIL">Pago Movil</option>
                <option value="PUNTO_VENTA">Tarjeta / Punto de Venta (POS)</option>
                <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                <option value="ZELLE">Zelle / Divisas</option>
              </select>
            </div>

            <!-- RESUMEN DE COBRO Y PAGO GENERADO AL CLIENTE -->
            <div class="card bg-light border-0 p-3 mb-3" *ngIf="membresiaModalId && precioFinalConDescuento">
              <div class="d-flex justify-content-between small text-muted mb-1">
                <span>Precio Plan:</span>
                <span>$ {{ precioFinalConDescuento.precioOriginal | number:'1.2-2' }}</span>
              </div>
              <div class="d-flex justify-content-between small text-success mb-1" *ngIf="precioFinalConDescuento.descuento > 0">
                <span>Descuento Promocional:</span>
                <span>-$ {{ precioFinalConDescuento.descuento | number:'1.2-2' }}</span>
              </div>
              <hr class="my-1 text-muted">
              <div class="d-flex justify-content-between fw-bold text-dark fs-6">
                <span>Monto a Cobrar / Pago:</span>
                <span class="text-primary">$ {{ precioFinalConDescuento.total | number:'1.2-2' }}</span>
              </div>
              <div class="d-flex justify-content-between small text-muted mt-1">
                <span>Equivalente BCV:</span>
                <span class="text-success fw-bold">{{ precioFinalConDescuento.total | bcvConvert:'USD' }}</span>
              </div>
            </div>

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
              <i class="bi bi-info-circle me-1"></i>Al asignar el plan, se generara el pago correspondiente al cliente, se actualizara su fecha de vencimiento y se habilitaran los torniquetes en tiempo real.
            </div>
          </div>
          <div class="modal-footer bg-light py-2">
            <button type="button" class="btn btn-secondary btn-sm" (click)="cerrarModalMembresia()">Cancelar</button>
            <button type="button" class="btn btn-success btn-sm px-3" (click)="guardarMembresia()" [disabled]="guardando">
              <i class="bi bi-check2-circle me-1"></i>Guardar y Asignar
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
  catalogoMembresias: any[] = [];
  catalogoPromociones: any[] = [];
  promocionesFiltradas: any[] = [];
  cuponSeleccionadoCodigo: string = '';
  metodoPagoSeleccionado: string = 'EFECTIVO';
  membresiaModalId: number | null = null;
  pulseraInput: string = '';
  guardando: boolean = false;

  get membresiaModalSeleccionada(): any {
    return this.catalogoMembresias.find(m => m.id === this.membresiaModalId);
  }

  get promocionModalSeleccionada(): any {
    if (!this.cuponSeleccionadoCodigo) return null;
    return this.catalogoPromociones.find(p => p.codigo === this.cuponSeleccionadoCodigo);
  }

  get precioFinalConDescuento(): { precioOriginal: number; descuento: number; total: number; etiqueta: string } {
    const mem = this.membresiaModalSeleccionada;
    if (!mem || !mem.precio) {
      return { precioOriginal: 0, descuento: 0, total: 0, etiqueta: '' };
    }
    const precioBase = Number(mem.precio);
    const promo = this.promocionModalSeleccionada;
    if (!promo) {
      return { precioOriginal: precioBase, descuento: 0, total: precioBase, etiqueta: '' };
    }

    let descuento = 0;
    let etiqueta = '';
    const tipo = (promo.tipoDescuento || '').toUpperCase();
    const val = Number(promo.valorDescuento || 0);

    if (tipo === 'PORCENTAJE') {
      descuento = (precioBase * val) / 100;
      etiqueta = `${val}% de descuento aplicado`;
    } else if (tipo === 'MONTO_FIJO') {
      descuento = val;
      etiqueta = `$${val} de rebaja directa`;
    } else if (tipo === 'DOS_POR_UNO' || tipo === '2X1') {
      descuento = precioBase * 0.50;
      etiqueta = `Promo 2x1 (50% de descuento en la cuota)`;
    } else if (tipo === 'DIAS_EXTRA' || tipo === 'MESES_EXTRA') {
      descuento = 0;
      etiqueta = `+${val} dias gratis de acceso adicional`;
    }

    if (descuento > precioBase) descuento = precioBase;
    const total = Math.max(0, precioBase - descuento);
    return {
      precioOriginal: Math.round(precioBase * 100) / 100,
      descuento: Math.round(descuento * 100) / 100,
      total: Math.round(total * 100) / 100,
      etiqueta
    };
  }

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
  filtroSedeId: number | null = null;
  private sedeSub?: Subscription;

  constructor(
    private clienteService: ClienteService,
    private http: HttpClient,
    private alertModal: AlertModalService,
    private sedeStateService: SedeStateService
  ) {}

  ngOnInit(): void {
    this.sedeSub = this.sedeStateService.sedeSeleccionadaId$.subscribe(id => {
      this.filtroSedeId = id;
      this.filtrarClientes();
    });
    this.cargarClientes();
    this.cargarMembresiasCatalogo();
  }

  cargarMembresiasCatalogo(): void {
    this.http.get<any[]>('/api/v1/membresias').subscribe({
      next: (mems) => (this.catalogoMembresias = mems || []),
      error: (err) => console.error('Error al cargar catalogo de membresias:', err)
    });
    this.http.get<any[]>('/api/v1/membresias/promociones').subscribe({
      next: (promos) => (this.catalogoPromociones = promos || []),
      error: (err) => console.error('Error al cargar catalogo de promociones:', err)
    });
  }

  ngOnDestroy(): void {
    this.cerrarWebSocket();
    if (this.sedeSub) {
      this.sedeSub.unsubscribe();
    }
  }

  cerrarSesionMovil(cliente: Cliente): void {
    if (!cliente || !cliente.id) return;
    this.alertModal.confirm(
      `¿Está seguro de cerrar de forma remota la sesión móvil de ${cliente.nombre} ${cliente.apellido}? La aplicación del usuario retornará al inicio de sesión.`,
      '¿Cerrar Sesión Móvil?',
      'Sí, Cerrar Sesión App',
      'Cancelar'
    ).then((confirmado) => {
      if (confirmado) {
        this.clienteService.cerrarSesionMovil(cliente.id!).subscribe({
          next: (res) => {
            cliente.sesionMovilActiva = false;
            this.alertModal.success(`La sesión móvil de ${cliente.nombre} ${cliente.apellido} ha sido invalidada con éxito.`, 'Sesión Móvil Cerrada');
          },
          error: (err) => {
            console.error('Error al cerrar sesión móvil:', err);
            this.alertModal.error('No se pudo cerrar la sesión móvil del cliente.', 'Error');
          }
        });
      }
    });
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
      
      let matchSede = true;
      if (this.filtroSedeId !== null) {
        const sId = c.sede ? (c.sede.id || (c.sede as any).sede_id) : (c as any).sedeId || (c as any).sede_id;
        matchSede = sId !== null && sId !== undefined && Number(sId) === Number(this.filtroSedeId);
      }

      return matchTexto && matchMembresia && matchSede;
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

  async eliminarCliente(id: number): Promise<void> {
    const confirmado = await this.alertModal.confirm(
      'Desea eliminar este cliente permanentemente?',
      'Eliminar Cliente',
      'Eliminar',
      'Cancelar'
    );
    if (confirmado) {
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
    this.membresiaModalId = c.membresiaActual ? (c.membresiaActual.id || null) : null;
    this.cuponSeleccionadoCodigo = '';
    this.metodoPagoSeleccionado = 'EFECTIVO';
    this.actualizarPromocionesFiltradas();
    this.mostrarModalMembresia = true;
  }

  actualizarPromocionesFiltradas(): void {
    if (!this.membresiaModalId) {
      this.promocionesFiltradas = this.catalogoPromociones.filter(p => !p.membresiaAplica && p.activo !== false);
    } else {
      this.promocionesFiltradas = this.catalogoPromociones.filter(p =>
        p.activo !== false && (!p.membresiaAplica || p.membresiaAplica.id === this.membresiaModalId)
      );
    }
    // Si la promo elegida ya no aplica, resetearla
    if (this.cuponSeleccionadoCodigo && !this.promocionesFiltradas.some(p => p.codigo === this.cuponSeleccionadoCodigo)) {
      this.cuponSeleccionadoCodigo = '';
    }
  }

  onMembresiaModalChange(): void {
    this.actualizarPromocionesFiltradas();
  }

  cerrarModalMembresia(): void {
    this.mostrarModalMembresia = false;
    this.clienteSeleccionado = null;
    this.membresiaModalId = null;
    this.cuponSeleccionadoCodigo = '';
  }

  guardarMembresia(): void {
    if (!this.clienteSeleccionado || !this.clienteSeleccionado.id) return;
    this.guardando = true;

    if (this.membresiaModalId) {
      // Usar endpoint especializado de asignacion que aplica cupon, genera pago inmediato e invalida cache
      this.clienteService.asignarMembresiaAlCliente(
        this.clienteSeleccionado.id,
        Number(this.membresiaModalId),
        this.nuevoEstadoMembresia,
        this.cuponSeleccionadoCodigo || undefined,
        this.metodoPagoSeleccionado || 'EFECTIVO'
      ).subscribe({
        next: () => {
          this.guardando = false;
          this.cerrarModalMembresia();
          this.cargarClientes();
        },
        error: (err) => {
          console.error('Error al asignar membresia:', err);
          this.guardando = false;
        }
      });
    } else {
      // Actualizacion simple de estado si no se selecciono plan (Sin Membresia)
      this.clienteService.actualizarMembresia(this.clienteSeleccionado, 'SIN_MEMBRESIA').subscribe({
        next: () => {
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
