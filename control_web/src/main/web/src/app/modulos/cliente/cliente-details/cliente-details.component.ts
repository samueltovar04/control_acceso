import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ClienteService } from '../../../shared/cliente/cliente.service';
import { Cliente } from '../../../shared/cliente/cliente.model';
import { FinanzasService, Pago } from '../../../core/services/finanzas.service';
import { BcvConvertPipe } from '../../../shared/pipes/bcv-convert.pipe';

@Component({
  selector: 'app-cliente-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BcvConvertPipe],
  template: `
    <div class="container-fluid mt-4" *ngIf="cliente">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <a routerLink="/home/clientes" class="btn btn-outline-secondary btn-sm mb-2">
            <i class="bi bi-arrow-left me-1"></i>Volver a Clientes
          </a>
          <h2 class="mb-0 text-primary">{{ cliente.nombre }} {{ cliente.apellido }}</h2>
          <span class="text-muted small">Cedula / Documento: {{ cliente.documento }}</span>
        </div>
        <div>
          <a [routerLink]="['/home/cliente-edit', cliente.id]" class="btn btn-primary">
            <i class="bi bi-pencil me-1"></i>Editar Perfil
          </a>
        </div>
      </div>

      <div class="row g-4">
        <!-- COLUMNA IZQUIERDA: PERFIL Y PASE DIGITAL QR -->
        <div class="col-md-4">
          <div class="card shadow-sm border-0 text-center p-4 bg-white">
            <img [src]="cliente.foto || 'assets/images/user-placeholder.png'" 
                 class="rounded-circle mx-auto mb-3 shadow" 
                 style="width: 130px; height: 130px; object-fit: cover;" 
                 onerror="this.src='https://cdn-icons-png.flaticon.com/512/3135/3135715.png'">
            <h4>{{ cliente.nombre }} {{ cliente.apellido }}</h4>
            <p class="text-muted small mb-2">{{ cliente.email || 'Sin correo electronico' }}</p>
            <div class="mb-3">
              <span class="badge" [ngClass]="{
                'bg-success': cliente.estadoSuscripcion === 'ACTIVA',
                'bg-danger': cliente.estadoSuscripcion === 'VENCIDA' || cliente.estadoSuscripcion === 'MOROSO',
                'bg-warning text-dark': cliente.estadoSuscripcion === 'POR_VENCER' || cliente.estadoSuscripcion === 'PENDIENTE_CONCILIAR',
                'bg-secondary': !cliente.estadoSuscripcion || cliente.estadoSuscripcion === 'SIN_MEMBRESIA'
              }">
                {{ cliente.estadoSuscripcion === 'ACTIVA' ? 'Suscripción Activa' : (cliente.estadoSuscripcion || 'SIN MEMBRESIA') }}
              </span>
            </div>

            <!-- BANNER DE ACCESO TEMPORAL SI ESTA EN CONCILIACION -->
            <div class="alert alert-warning text-start small mb-3 p-2" *ngIf="cliente.estadoSuscripcion === 'PENDIENTE_CONCILIAR'">
              <i class="bi bi-clock-history me-1 fw-bold"></i>
              <strong>En conciliación:</strong> Pase de gracia activo en torniquetes.
            </div>

            <hr>

            <!-- PASE DIGITAL QR GENERADO POR CEDULA / DOCUMENTO -->
            <h6 class="text-start fw-bold mb-2"><i class="bi bi-qr-code me-2"></i>Pase Digital de Acceso</h6>
            <div class="p-3 bg-light rounded text-center">
              <div class="bg-white p-2 d-inline-block rounded border mb-2 shadow-sm">
                <img [src]="'https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=' + (cliente.documento || cliente.codigoInsignia || cliente.id)" 
                     alt="Codigo QR Cliente" 
                     class="img-fluid" 
                     style="width: 150px; height: 150px; object-fit: contain;">
              </div>
              <div class="small fw-bold text-truncate text-dark">Cédula: {{ cliente.documento }}</div>
              <small class="text-muted d-block mt-1">Presente este codigo QR en los lectores de los torniquetes para validar su paso.</small>
            </div>
          </div>
        </div>

        <!-- COLUMNA DERECHA: SECCIONES AGREGADAS + ENROLAMIENTO Y PISOS -->
        <div class="col-md-8">
          <!-- 1. AVISOS DE PAGO Y CONFIRMACIONES -->
          <div class="card shadow-sm border-0 p-3 bg-white mb-4">
            <h5 class="fw-bold text-primary mb-3"><i class="bi bi-bell-fill me-1"></i> Avisos de Pago y Confirmaciones</h5>
            <div class="list-group">
              <div class="list-group-item d-flex justify-content-between align-items-center" *ngFor="let n of notificaciones">
                <div>
                  <h6 class="fw-bold mb-1">{{ n.titulo }}</h6>
                  <p class="mb-0 text-muted small">{{ n.mensaje }}</p>
                </div>
                <small class="text-muted">{{ n.fechaEnvio ? (n.fechaEnvio | date:'short') : '' }}</small>
              </div>
              <div *ngIf="notificaciones.length === 0" class="text-muted text-center py-2">
                No tiene avisos de pago pendientes.
              </div>
            </div>
          </div>

          <!-- 2. PAGAR / RENOVAR MEMBRESÍA -->
          <div class="card shadow-sm border-0 p-3 bg-white mb-4">
            <h5 class="fw-bold text-success mb-3"><i class="bi bi-credit-card-fill me-1"></i> Pagar / Renovar Membresia</h5>

            <!-- MENSAJES DE ESTADO INLINE (SIN WINDOW ALERTS) -->
            <div *ngIf="mensajeExito" class="alert alert-success d-flex align-items-center py-2 px-3 small border-0 mb-3 shadow-sm">
              <i class="bi bi-check-circle-fill me-2 fs-5"></i>
              <div>{{ mensajeExito }}</div>
            </div>

            <div *ngIf="errorFormulario" class="alert alert-danger d-flex align-items-center py-2 px-3 small border-0 mb-3 shadow-sm">
              <i class="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
              <div>{{ errorFormulario }}</div>
            </div>

            <!-- TABLA DE CUOTAS / PAGOS PENDIENTES DEL CLIENTE -->
            <div class="mb-3" *ngIf="pagosPendientesCliente.length > 0">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="small fw-bold text-dark">
                  <i class="bi bi-receipt me-1 text-primary"></i>Cuotas y Pagos Pendientes Encontrados ({{ pagosPendientesCliente.length }}):
                </span>
                <button type="button" class="btn btn-sm btn-outline-primary py-0 px-2 small" (click)="toggleTodosLosPagos()">
                  {{ pagosSeleccionadosIds.size === pagosPendientesCliente.length ? 'Desmarcar todos' : 'Seleccionar todos' }}
                </button>
              </div>
              <div class="table-responsive border rounded bg-light p-1">
                <table class="table table-sm table-hover align-middle mb-0">
                  <thead class="table-light small">
                    <tr>
                      <th style="width: 40px;" class="text-center">#</th>
                      <th>Concepto / Cuota</th>
                      <th>Fecha</th>
                      <th class="text-end">Monto ($)</th>
                      <th class="text-end">Monto (VES)</th>
                    </tr>
                  </thead>
                  <tbody class="small">
                    <tr *ngFor="let p of pagosPendientesCliente" (click)="togglePagoSeleccionado(p.id!)" style="cursor: pointer;">
                      <td class="text-center" (click)="$event.stopPropagation()">
                        <input type="checkbox" class="form-check-input" [checked]="pagosSeleccionadosIds.has(p.id!)" (change)="togglePagoSeleccionado(p.id!)">
                      </td>
                      <td>
                        <span class="fw-semibold">Cuota #{{ p.id }}</span>
                        <span *ngIf="p.numeroReferencia" class="text-muted ms-1">({{ p.numeroReferencia }})</span>
                      </td>
                      <td class="text-muted">{{ p.fechaPago ? (p.fechaPago | date:'shortDate') : 'Al corte' }}</td>
                      <td class="text-end fw-bold text-dark">&dollar;{{ p.monto | number:'1.2-2' }}</td>
                      <td class="text-end text-muted">{{ p.monto | bcvConvert:'USD' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- MENSAJE INFORMATIVO SI EL BOTON ESTA INHABILITADO -->
            <div class="alert alert-info py-2 px-3 small border-0 mb-3" *ngIf="!tienePagoHabilitado && pagosPendientesCliente.length === 0">
              <i class="bi bi-info-circle me-1"></i>
              El cliente tiene su membresia <strong>ACTIVA</strong> y al dia. La renovacion se habilitara automaticamente cuando el estado sea <strong>Por Vencer</strong>, <strong>Vencido</strong>, <strong>Moroso</strong> o registre cobros pendientes.
            </div>

            <form (ngSubmit)="enviarPagoVerificacion()" class="row g-3">
              <div class="col-md-4">
                <label class="form-label small fw-bold">Monto a Pagar ($) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0.01" 
                  class="form-control" 
                  [(ngModel)]="nuevoPagoCliente.monto" 
                  name="monto" 
                  [readonly]="pagosPendientesCliente.length > 0"
                  required>
                <small class="text-success fw-semibold mt-1 d-block" *ngIf="nuevoPagoCliente.monto > 0">
                  <i class="bi bi-currency-exchange me-1"></i>Equivalente: {{ nuevoPagoCliente.monto | bcvConvert:'USD' }}
                </small>
              </div>

              <div class="col-md-4">
                <label class="form-label small fw-bold">Metodo de Pago *</label>
                <select class="form-select" [(ngModel)]="nuevoPagoCliente.metodoPago" name="metodo">
                  <option value="PAGO_MOVIL">Pago Movil</option>
                  <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                  <option value="EFECTIVO_USD">Efectivo USD (Divisas)</option>
                  <option value="EFECTIVO_VES">Efectivo Bolivares (VES)</option>
                  <option value="TARJETA">Punto de Venta / Tarjeta</option>
                  <option value="ZELLE">Zelle</option>
                  <option value="BINANCE">Binance Pay / USDT</option>
                  <option value="APP_ONLINE">Pago en Linea / Web</option>
                </select>
              </div>

              <div class="col-md-4">
                <label class="form-label small fw-bold">Nro de Referencia / Comprobante *</label>
                <input 
                  type="text" 
                  class="form-control" 
                  [class.is-invalid]="errorReferencia"
                  [(ngModel)]="nuevoPagoCliente.numeroReferencia" 
                  name="referencia" 
                  placeholder="Obligatorio (Ej. 12345678)"
                  (input)="errorReferencia = ''"
                  required>
                <div class="invalid-feedback d-block" *ngIf="errorReferencia">
                  {{ errorReferencia }}
                </div>
              </div>

              <!-- SUBIR COMPROBANTE OPCIONAL -->
              <div class="col-12">
                <label class="form-label small fw-bold text-secondary">
                  <i class="bi bi-image me-1 text-primary"></i>Subir Comprobante de Pago (Opcional)
                </label>
                <input type="file" class="form-control form-control-sm" accept="image/*,.pdf" (change)="onArchivoComprobante($event)">
                
                <div *ngIf="comprobantePreview" class="position-relative mt-2 border rounded p-2 text-center bg-light" style="max-width: 250px;">
                  <img [src]="comprobantePreview" alt="Comprobante" class="img-fluid rounded" style="max-height: 120px; object-fit: contain;">
                  <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle" (click)="removerComprobante()">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>

              <!-- BOTON CONFIRMAR (HABILITADO SOLO SI TIENE PAGO EN CURSO O PENDIENTE O MOROSO) -->
              <div class="col-12">
                <button 
                  type="submit" 
                  class="btn btn-success w-100 fw-bold py-2 shadow-sm"
                  [disabled]="!tienePagoHabilitado || enviandoPago || !nuevoPagoCliente.monto">
                  <i class="bi bi-send-fill me-1"></i>
                  {{ enviandoPago ? 'Enviando Pago...' : 'Enviar Pago para Verificacion' }}
                </button>
              </div>
            </form>
          </div>

          <!-- 3. ENROLAMIENTO BIOMETRICO DUAL (PREEXISTENTE SIN MODIFICAR) -->
          <div class="card shadow-sm border-0 mb-4 bg-white">
            <div class="card-header bg-white py-3 border-0">
              <h5 class="mb-0 fw-bold"><i class="bi bi-shield-fill-check me-2 text-primary"></i>Enrolamiento Biometrico Dual</h5>
            </div>
            <div class="card-body pt-0">
              <div class="row g-3">
                <div class="col-md-6">
                  <div class="p-3 border rounded bg-light">
                    <div class="d-flex align-items-center mb-2">
                      <i class="bi bi-fingerprint fs-4 text-primary me-2"></i>
                      <div class="fw-bold">Plantillas Dactilares</div>
                    </div>
                    <div class="small mb-1">Huella Principal (Pulgar): 
                      <span class="badge" [ngClass]="cliente.huella1 ? 'bg-success' : 'bg-danger'">
                        {{ cliente.huella1 ? 'Enrolada' : 'Pendiente' }}
                      </span>
                    </div>
                    <div class="small">Huella Secundaria (Indice): 
                      <span class="badge" [ngClass]="cliente.huella2 ? 'bg-success' : 'bg-secondary'">
                        {{ cliente.huella2 ? 'Enrolada' : 'Opcional' }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="col-md-6">
                  <div class="p-3 border rounded bg-light">
                    <div class="d-flex align-items-center mb-2">
                      <i class="bi bi-camera-video fs-4 text-info me-2"></i>
                      <div class="fw-bold">Vector Facial 128D</div>
                    </div>
                    <div class="small mb-1">Embedding Facial: 
                      <span class="badge" [ngClass]="cliente.faceVector ? 'bg-success' : 'bg-danger'">
                        {{ cliente.faceVector ? 'Vector 128D Activo' : 'Sin Enrolar' }}
                      </span>
                    </div>
                    <small class="text-muted">Reconocimiento rapido en camaras de torniquete</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. PISOS Y ZONAS AUTORIZADAS (PREEXISTENTE SIN MODIFICAR) -->
          <div class="card shadow-sm border-0 bg-white">
            <div class="card-header bg-white py-3 border-0">
              <h5 class="mb-0 fw-bold"><i class="bi bi-building me-2 text-success"></i>Pisos y Zonas Autorizadas</h5>
            </div>
            <div class="card-body pt-0">
              <div *ngIf="cliente.pisosPermitidos && cliente.pisosPermitidos.length > 0; else noPisos">
                <span class="badge bg-primary me-2 p-2" *ngFor="let p of cliente.pisosPermitidos">
                  <i class="bi bi-geo-alt me-1"></i>{{ p.nombre }}
                </span>
              </div>
              <ng-template #noPisos>
                <p class="text-muted mb-0"><i class="bi bi-info-circle me-1"></i>Acceso general a pisos estandar de clientes.</p>
              </ng-template>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ClienteDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private clienteService = inject(ClienteService);
  private finanzasService = inject(FinanzasService);
  private http = inject(HttpClient);

  cliente?: Cliente;
  qrData?: any;

  notificaciones: any[] = [];
  pagosPendientesCliente: Pago[] = [];
  pagosSeleccionadosIds: Set<number> = new Set<number>();
  cargandoPagosPendientes: boolean = false;

  errorReferencia: string = '';
  errorFormulario: string = '';
  mensajeExito: string = '';

  nuevoPagoCliente = {
    monto: 0,
    metodoPago: 'PAGO_MOVIL',
    numeroReferencia: '',
    comprobanteUrl: ''
  };

  comprobantePreview: string | null = null;
  enviandoPago: boolean = false;

  get tienePagoHabilitado(): boolean {
    if (!this.cliente) return false;
    const est = (this.cliente.estadoSuscripcion || '').toUpperCase();
    return (
      est === 'VENCIDA' ||
      est === 'MOROSO' ||
      est === 'POR_VENCER' ||
      est === 'PENDIENTE_CONCILIAR' ||
      est === 'PENDIENTE_CONCILIACION' ||
      est === 'SIN_MEMBRESIA' ||
      est === 'SUSPENDIDA'
    );
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.cargarCliente(id);
    }
  }

  cargarCliente(id: number): void {
    this.clienteService.getCliente(id).subscribe({
      next: (data) => {
        this.cliente = data;
        this.prepararMontoMembresia();
      },
      error: (err) => console.error('Error al cargar detalle de cliente:', err)
    });

    this.clienteService.getTokenQr(id).subscribe({
      next: (qr) => (this.qrData = qr),
      error: (err) => console.error('Error al cargar QR de cliente:', err)
    });

    this.http.get<any[]>(`/api/v1/notificaciones/cliente/${id}`).subscribe({
      next: (data) => (this.notificaciones = data || []),
      error: () => (this.notificaciones = [])
    });
  }

  prepararMontoMembresia(): void {
    if (!this.cliente?.id) return;
    this.cargandoPagosPendientes = true;
    this.pagosSeleccionadosIds.clear();

    this.http.get<Pago[]>(`/api/v1/finanzas/pagos/cliente/${this.cliente.id}/pendientes`).subscribe({
      next: (pendientes) => {
        this.pagosPendientesCliente = pendientes || [];
        this.cargandoPagosPendientes = false;

        if (this.pagosPendientesCliente.length > 0) {
          this.pagosSeleccionadosIds.add(this.pagosPendientesCliente[0].id!);
          this.calcularMontoSeleccionado();
        } else if (this.cliente?.membresiaActual?.precio) {
          this.nuevoPagoCliente.monto = Number(this.cliente.membresiaActual.precio);
        } else {
          this.consultarCotizacionActual();
        }
      },
      error: () => {
        this.cargandoPagosPendientes = false;
        if (this.cliente?.membresiaActual?.precio) {
          this.nuevoPagoCliente.monto = Number(this.cliente.membresiaActual.precio);
        } else {
          this.consultarCotizacionActual();
        }
      }
    });
  }

  consultarCotizacionActual(): void {
    if (!this.cliente?.id) return;
    this.http.get<any>(`/api/v1/finanzas/cotizacion-actual?clienteId=${this.cliente.id}`).subscribe({
      next: (cot) => {
        this.nuevoPagoCliente.monto = cot?.precioBaseUSD ? Number(cot.precioBaseUSD) : 50.0;
      },
      error: () => {
        this.nuevoPagoCliente.monto = 50.0;
      }
    });
  }

  togglePagoSeleccionado(pago: Pago): void {
    if (!pago.id) return;
    if (this.pagosSeleccionadosIds.has(pago.id)) {
      this.pagosSeleccionadosIds.delete(pago.id);
    } else {
      this.pagosSeleccionadosIds.add(pago.id);
    }
    this.calcularMontoSeleccionado();
  }

  toggleTodosLosPagos(): void {
    if (this.pagosSeleccionadosIds.size === this.pagosPendientesCliente.length) {
      this.pagosSeleccionadosIds.clear();
    } else {
      this.pagosPendientesCliente.forEach(p => {
        if (p.id) this.pagosSeleccionadosIds.add(p.id);
      });
    }
    this.calcularMontoSeleccionado();
  }

  calcularMontoSeleccionado(): void {
    let suma = 0;
    this.pagosPendientesCliente.forEach(p => {
      if (p.id && this.pagosSeleccionadosIds.has(p.id)) {
        suma += (Number(p.monto) || 0);
      }
    });
    this.nuevoPagoCliente.monto = Number(suma.toFixed(2));
  }

  onArchivoComprobante(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.comprobantePreview = e.target.result;
        this.nuevoPagoCliente.comprobanteUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removerComprobante(): void {
    this.comprobantePreview = null;
    this.nuevoPagoCliente.comprobanteUrl = '';
  }

  enviarPagoVerificacion(): void {
    this.errorReferencia = '';
    this.errorFormulario = '';
    this.mensajeExito = '';

    if (!this.cliente?.id) return;
    if (!this.nuevoPagoCliente.monto || this.nuevoPagoCliente.monto <= 0) {
      this.errorFormulario = 'Seleccione al menos una cuota o ingrese un monto valido a pagar.';
      return;
    }

    if (!this.nuevoPagoCliente.numeroReferencia || !this.nuevoPagoCliente.numeroReferencia.trim()) {
      this.errorReferencia = 'El numero de referencia o comprobante es requerido.';
      return;
    }

    this.enviandoPago = true;
    const pago: Pago = {
      cliente: { id: this.cliente.id },
      monto: this.nuevoPagoCliente.monto,
      metodoPago: this.nuevoPagoCliente.metodoPago as any,
      origenPago: 'WEB_CLIENTE',
      registradoPor: 'Ficha Cliente / QR',
      numeroReferencia: this.nuevoPagoCliente.numeroReferencia.trim(),
      comprobanteUrl: this.nuevoPagoCliente.comprobanteUrl,
      estadoPago: 'PENDIENTE_CONCILIACION'
    };

    this.finanzasService.registrarPago(pago).subscribe({
      next: () => {
        this.mensajeExito = 'Pago registrado con exito. Enviado a la bandeja de Conciliacion.';
        this.enviandoPago = false;
        this.removerComprobante();
        this.nuevoPagoCliente.numeroReferencia = '';
        this.cargarCliente(this.cliente!.id!);
        this.prepararMontoMembresia();
      },
      error: () => {
        this.errorFormulario = 'Error al registrar el pago del cliente. Intente nuevamente.';
        this.enviandoPago = false;
      }
    });
  }
}

function SystemDateMs(): number {
  return Date.now();
}
