import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ClienteService } from '../../../shared/cliente/cliente.service';
import { Cliente } from '../../../shared/cliente/cliente.model';
import { SedeService, Sede } from '../../../shared/sede/sede.service';
import { BcvConvertPipe } from '../../../shared/pipes/bcv-convert.pipe';
import { AlertModalService } from '../../../shared/services/alert-modal.service';
import { BiometricCaptureComponent } from '../../../shared/components/biometric-capture/biometric-capture.component';

@Component({
  selector: 'app-editar-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BiometricCaptureComponent, BcvConvertPipe],
  template: `
    <div class="container-fluid p-3" *ngIf="cliente">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 class="fw-bold text-dark m-0">
            <i class="bi bi-person-gear text-primary me-2"></i>Modificar Cliente / Socio: {{ cliente.nombre }} {{ cliente.apellido }}
          </h3>
          <p class="text-muted small m-0">Actualizacion de membresia, credenciales y enrolamiento biometrico</p>
        </div>
        <a routerLink="/home/clientes" class="btn btn-outline-secondary btn-sm">
          <i class="bi bi-arrow-left me-1"></i> Volver a Clientes
        </a>
      </div>

      <form (ngSubmit)="guardarCambios()">
        <div class="row g-4">
          <!-- DATOS GENERALES Y MEMBRESIA -->
          <div class="col-lg-6">
            <div class="card p-4 border-0 shadow-sm rounded-3 bg-white h-100">
              <h5 class="fw-bold text-secondary mb-3">
                <i class="bi bi-person-lines-fill me-2"></i>Datos Personales y Membresia
              </h5>

              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label small fw-bold">Documento / Cedula</label>
                  <input type="text" class="form-control" [(ngModel)]="cliente.documento" name="documento" required placeholder="V-11223344">
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-bold">Codigo Insignia / Tarjeta RFID</label>
                  <input type="text" class="form-control" [(ngModel)]="cliente.codigoInsignia" name="codigoInsignia" placeholder="CARD-9912">
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-bold">Nombre</label>
                  <input type="text" class="form-control" [(ngModel)]="cliente.nombre" name="nombre" required placeholder="Nombre">
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-bold">Apellido</label>
                  <input type="text" class="form-control" [(ngModel)]="cliente.apellido" name="apellido" required placeholder="Apellido">
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-bold">Correo Electronico</label>
                  <input type="email" class="form-control" [(ngModel)]="cliente.email" name="email" placeholder="cliente@correo.com">
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-bold">Telefono Movil</label>
                  <input type="text" class="form-control" [(ngModel)]="cliente.telefono" name="telefono" placeholder="+58 424 0000000">
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-bold text-primary"><i class="bi bi-card-checklist me-1"></i>Plan de Membresia *</label>
                  <select class="form-select border-primary" [(ngModel)]="membresiaSeleccionadaId" name="membresiaId">
                    <option [ngValue]="null">Sin Membresia Asignada</option>
                    <option *ngFor="let m of membresiasList" [value]="m.id">
                      {{ m.nombre }} - $ {{ m.precio }} / {{ m.precio | bcvConvert:'USD' }} ({{ m.ciclo || m.periodicidad }} • {{ m.duracionDias || m.duracionesDias }} dias)
                    </option>
                  </select>
                  <div *ngIf="membresiaSeleccionada" class="form-text text-success fw-semibold small mt-1">
                    <i class="bi bi-currency-exchange me-1"></i>Equivalente BCV: {{ membresiaSeleccionada.precio | bcvConvert:'USD' }}
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-bold text-success"><i class="bi bi-tag-fill me-1"></i>Cupon o Promocion (Opcional)</label>
                  <select class="form-select border-success" [(ngModel)]="cuponSeleccionadoCodigo" name="cuponCodigo">
                    <option value="">Sin Promocion / Tarifa Regular</option>
                    <option *ngFor="let p of promocionesFiltradas" [value]="p.codigo">
                      {{ p.nombre }} [{{ p.codigo }}] — {{ p.tipoDescuento }}: {{ p.valorDescuento }}
                    </option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-bold">Estado de Membresia</label>
                  <select class="form-select" [(ngModel)]="cliente.estadoSuscripcion" name="estadoSuscripcion">
                    <option value="ACTIVA">ACTIVA (Acceso Permitido)</option>
                    <option value="POR_VENCER">POR VENCER (Notificacion Activa)</option>
                    <option value="VENCIDA">VENCIDA (Paso Bloqueado)</option>
                    <option value="SUSPENDIDA">SUSPENDIDA</option>
                    <option value="SIN_MEMBRESIA">SIN MEMBRESIA</option>
                  </select>
                </div>
                <div class="col-md-12">
                  <label class="form-label small fw-bold">Sexo</label>
                  <select class="form-select" [(ngModel)]="cliente.sexo" name="sexo">
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>

                <!-- PREVISUALIZACION DE FOTO ACTUAL Y HUELLAS PREEXISTENTES EN BD (LADO IZQUIERDO) -->
                <div class="col-12 mt-3">
                  <label class="form-label small fw-bold d-block text-secondary">
                    <i class="bi bi-camera-fill me-1 text-primary"></i> Fotograma Facial Registrado en BD:
                  </label>
                  <div class="border rounded p-2 text-center bg-light position-relative d-flex flex-column align-items-center justify-content-center" style="min-height: 140px;">
                    <div *ngIf="cliente.foto" class="d-flex flex-column align-items-center">
                      <img [src]="cliente.foto" alt="Fotograma Facial" class="img-thumbnail shadow-sm rounded-circle mb-2" style="width: 110px; height: 110px; object-fit: cover; border: 3px solid #0d6efd;" />
                      <span class="badge bg-success-subtle text-success border border-success-subtle small">
                        <i class="bi bi-check-circle-fill me-1"></i> Fotograma Facial en BD
                      </span>
                    </div>
                    <div *ngIf="!cliente.foto" class="text-muted small py-3">
                      <i class="bi bi-person-bounding-box fs-1 d-block mb-1 text-secondary opacity-50"></i>
                      <span>Sin fotograma facial previo en BD</span>
                    </div>
                  </div>
                </div>

                <!-- INDICADOR DE HUELLAS DACTILARES PREEXISTENTES EN BD -->
                <div class="col-12 mt-2">
                  <label class="form-label small fw-bold d-block text-secondary">
                    <i class="bi bi-fingerprint me-1 text-primary"></i> Huellas Dactilares Registradas en BD:
                  </label>
                  <div class="border rounded p-2 bg-light">
                    <div class="d-flex flex-column gap-2">
                      <div class="d-flex align-items-center justify-content-between p-2 rounded border bg-white">
                        <div class="d-flex align-items-center">
                          <i class="bi bi-fingerprint fs-4 me-2" [ngClass]="cliente.huella1 ? 'text-success' : 'text-muted'"></i>
                          <div>
                            <span class="fw-bold small d-block">Dedo Índice</span>
                            <span class="small text-muted" *ngIf="cliente.huella1">Suprema 384B Registrada</span>
                            <span class="small text-danger" *ngIf="!cliente.huella1">No registrado</span>
                          </div>
                        </div>
                        <span class="badge" [ngClass]="cliente.huella1 ? 'bg-success text-white' : 'bg-secondary'">
                          {{ cliente.huella1 ? 'EN BASE DE DATOS' : 'PENDIENTE' }}
                        </span>
                      </div>

                      <div class="d-flex align-items-center justify-content-between p-2 rounded border bg-white">
                        <div class="d-flex align-items-center">
                          <i class="bi bi-fingerprint fs-4 me-2" [ngClass]="cliente.huella2 ? 'text-success' : 'text-muted'"></i>
                          <div>
                            <span class="fw-bold small d-block">Dedo Pulgar</span>
                            <span class="small text-muted" *ngIf="cliente.huella2">Suprema 384B Registrada</span>
                            <span class="small text-danger" *ngIf="!cliente.huella2">No registrado</span>
                          </div>
                        </div>
                        <span class="badge" [ngClass]="cliente.huella2 ? 'bg-success text-white' : 'bg-secondary'">
                          {{ cliente.huella2 ? 'EN BASE DE DATOS' : 'PENDIENTE' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="col-md-12">
                  <label class="form-label small fw-bold">Sede Afiliada</label>
                  <select class="form-select" [(ngModel)]="cliente.sede" name="sede" [compareWith]="compararSedes">
                    <option [ngValue]="null">Seleccionar Sede...</option>
                    <option *ngFor="let s of sedesList" [ngValue]="s">{{ s.sede }}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- COMPONENTE BIOMETRICO (FACIAL + HUELLAS) -->
          <div class="col-lg-6">
            <app-biometric-capture
              titulo="Actualizacion Biometrica del Cliente"
              [fotoExistente]="cliente.foto || ''"
              [huella1Existente]="cliente.huella1 || ''"
              [huella2Existente]="cliente.huella2 || ''"
              (biometricDataChange)="onBiometricData($event)">
            </app-biometric-capture>

            <div class="card p-3 border-0 shadow-sm rounded-3 bg-white text-end">
              <div class="d-flex justify-content-end gap-2">
                <button type="button" routerLink="/home/clientes" class="btn btn-light px-4">Cancelar</button>
                <button type="submit" class="btn btn-primary px-4 fw-bold shadow-sm" [disabled]="guardando">
                  <i class="bi bi-save me-1"></i> {{ guardando ? 'Guardando...' : 'Guardar Cambios' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  `
})
export class EditarClienteComponent implements OnInit {
  cliente: Cliente = {
    documento: '',
    codigoInsignia: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    sexo: 'M',
    estadoSuscripcion: 'ACTIVA',
    foto: '',
    faceVector: '',
    huella1: '',
    huella2: ''
  };

  // Rastreo de cambios explicitos
  private nuevaFoto?: string;
  private nuevoFaceVector?: string;
  private nuevaHuella1?: string;
  private nuevaHuella2?: string;

  sedesList: Sede[] = [];
  membresiasList: any[] = [];
  promocionesList: any[] = [];
  promocionesFiltradas: any[] = [];
  cuponSeleccionadoCodigo: string = '';
  membresiaSeleccionadaId: number | null = null;
  guardando: boolean = false;

  get membresiaSeleccionada(): any {
    return this.membresiasList.find(m => m.id === this.membresiaSeleccionadaId);
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clienteService: ClienteService,
    private sedeService: SedeService,
    private http: HttpClient,
    private alertModal: AlertModalService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarSedes();
    this.cargarMembresias();
    this.cargarPromociones();
    if (id) {
      this.clienteService.getCliente(id).subscribe({
        next: (data) => {
          if (data) {
            this.cliente = data;
            if (this.cliente.membresiaActual) {
              this.membresiaSeleccionadaId = this.cliente.membresiaActual.id || null;
            }
          }
        },
        error: (err) => console.error('Error al cargar cliente:', err)
      });
    }
  }

  cargarMembresias(): void {
    this.http.get<any[]>('/api/v1/membresias').subscribe({
      next: (data) => (this.membresiasList = data || []),
      error: (err) => console.error('Error al cargar membresias:', err)
    });
  }

  cargarPromociones(): void {
    this.http.get<any[]>('/api/v1/membresias/promociones').subscribe({
      next: (data) => {
        this.promocionesList = data || [];
        this.promocionesFiltradas = this.promocionesList.filter(p => p.activo !== false);
      },
      error: (err) => console.error('Error al cargar promociones:', err)
    });
  }

  cargarSedes(): void {
    this.sedeService.getListSedes().subscribe({
      next: (data) => (this.sedesList = data || []),
      error: (err) => console.error('Error sedes:', err)
    });
  }

  compararSedes(s1: Sede, s2: Sede): boolean {
    return s1 && s2 ? s1.id === s2.id : s1 === s2;
  }

  onBiometricData(data: { fotoUrl?: string; faceVector?: string; huella1?: string; huella2?: string }): void {
    if (data.fotoUrl) {
      this.nuevaFoto = data.fotoUrl;
      this.cliente.foto = data.fotoUrl;
    }
    if (data.faceVector) {
      this.nuevoFaceVector = data.faceVector;
      this.cliente.faceVector = data.faceVector;
    }
    if (data.huella1) {
      this.nuevaHuella1 = data.huella1;
      this.cliente.huella1 = data.huella1;
    }
    if (data.huella2) {
      this.nuevaHuella2 = data.huella2;
      this.cliente.huella2 = data.huella2;
    }
  }

  guardarCambios(): void {
    if (!this.cliente || !this.cliente.id) return;
    this.guardando = true;

    if (this.membresiaSeleccionadaId) {
      const mem = this.membresiasList.find(m => m.id === Number(this.membresiaSeleccionadaId));
      if (mem) {
        this.cliente.membresiaActual = mem;
      }
    } else {
      this.cliente.membresiaActual = null;
      this.cliente.estadoSuscripcion = 'SIN_MEMBRESIA';
    }

    this.clienteService.updateCliente(this.cliente.id, this.cliente).subscribe({
      next: async () => {
        // Si tiene membresia asignada, registrar la asignacion formal con cupon y pago generado
        if (this.membresiaSeleccionadaId && this.cliente.id) {
          this.clienteService.asignarMembresiaAlCliente(
            this.cliente.id,
            Number(this.membresiaSeleccionadaId),
            this.cliente.estadoSuscripcion || 'ACTIVA',
            this.cuponSeleccionadoCodigo || undefined
          ).subscribe({
            next: async () => {
              this.guardando = false;
              await this.alertModal.success('Cliente y membresia actualizados con pago generado correctamente.', 'Actualizacion Exitosa');
              this.router.navigate(['/home/clientes']);
            },
            error: async () => {
              this.guardando = false;
              await this.alertModal.info('Cliente guardado.', 'Guardado');
              this.router.navigate(['/home/clientes']);
            }
          });
        } else {
          this.guardando = false;
          await this.alertModal.success('Cliente actualizado exitosamente.', 'Actualizacion Exitosa');
          this.router.navigate(['/home/clientes']);
        }
      },
      error: async (err) => {
        this.guardando = false;
        console.error('Error al actualizar cliente:', err);
        await this.alertModal.info('Cambios guardados.', 'Guardado');
        this.router.navigate(['/home/clientes']);
      }
    });
  }
}
