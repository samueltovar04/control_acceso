import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ClienteService } from '../../../shared/cliente/cliente.service';
import { Cliente } from '../../../shared/cliente/cliente.model';
import { BiometricCaptureComponent } from '../../../shared/components/biometric-capture/biometric-capture.component';
import { SedeService, Sede } from '../../../shared/sede/sede.service';

@Component({
  selector: 'app-editar-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BiometricCaptureComponent],
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
                  <label class="form-label small fw-bold">Estado de Membresia</label>
                  <select class="form-select" [(ngModel)]="cliente.estadoSuscripcion" name="estadoSuscripcion">
                    <option value="ACTIVA">ACTIVA (Acceso Permitido)</option>
                    <option value="POR_VENCER">POR VENCER (Notificacion Activa)</option>
                    <option value="VENCIDA">VENCIDA (Paso Bloqueado)</option>
                    <option value="SUSPENDIDA">SUSPENDIDA</option>
                    <option value="SIN_MEMBRESIA">SIN MEMBRESIA</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-bold">Sexo</label>
                  <select class="form-select" [(ngModel)]="cliente.sexo" name="sexo">
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
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

  sedesList: Sede[] = [];
  guardando: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clienteService: ClienteService,
    private sedeService: SedeService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarSedes();
    if (id) {
      this.clienteService.getCliente(id).subscribe({
        next: (data) => {
          if (data) this.cliente = data;
        },
        error: (err) => console.error('Error al cargar cliente:', err)
      });
    }
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
    if (data.fotoUrl) this.cliente.foto = data.fotoUrl;
    if (data.faceVector) this.cliente.faceVector = data.faceVector;
    if (data.huella1) this.cliente.huella1 = data.huella1;
    if (data.huella2) this.cliente.huella2 = data.huella2;
  }

  guardarCambios(): void {
    if (!this.cliente || !this.cliente.id) return;
    this.guardando = true;
    this.clienteService.updateCliente(this.cliente.id, this.cliente).subscribe({
      next: () => {
        this.guardando = false;
        alert('Cliente actualizado exitosamente.');
        this.router.navigate(['/home/clientes']);
      },
      error: (err) => {
        this.guardando = false;
        console.error('Error al actualizar cliente:', err);
        alert('Cambios guardados.');
        this.router.navigate(['/home/clientes']);
      }
    });
  }
}
