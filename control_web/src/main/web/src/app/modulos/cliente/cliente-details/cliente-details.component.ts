import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ClienteService } from '../../../shared/cliente/cliente.service';
import { Cliente } from '../../../shared/cliente/cliente.model';

@Component({
  selector: 'app-cliente-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container-fluid mt-4" *ngIf="cliente">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <a routerLink="/home/clientes" class="btn btn-outline-secondary btn-sm mb-2">
            <i class="pi pi-arrow-left me-1"></i>Volver a Clientes
          </a>
          <h2 class="mb-0 text-primary">{{ cliente.nombre }} {{ cliente.apellido }}</h2>
          <span class="text-muted small">Cedula / Documento: {{ cliente.documento }}</span>
        </div>
        <div>
          <a [routerLink]="['/home/cliente-edit', cliente.id]" class="btn btn-primary">
            <i class="pi pi-pencil me-1"></i>Editar Perfil
          </a>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-md-4">
          <div class="card shadow-sm border-0 text-center p-4">
            <img [src]="cliente.foto || 'assets/images/user-placeholder.png'" class="rounded-circle mx-auto mb-3 shadow" style="width: 130px; height: 130px; object-fit: cover;" onerror="this.src='https://via.placeholder.com/130'">
            <h4>{{ cliente.nombre }} {{ cliente.apellido }}</h4>
            <p class="text-muted small mb-2">{{ cliente.email || 'Sin correo electronico' }}</p>
            <div class="mb-3">
              <span class="badge" [ngClass]="{
                'bg-success': cliente.estadoSuscripcion === 'ACTIVA',
                'bg-danger': cliente.estadoSuscripcion === 'VENCIDA',
                'bg-warning text-dark': cliente.estadoSuscripcion === 'POR_VENCER',
                'bg-secondary': !cliente.estadoSuscripcion || cliente.estadoSuscripcion === 'SIN_MEMBRESIA'
              }">{{ cliente.estadoSuscripcion || 'SIN MEMBRESIA' }}</span>
            </div>

            <hr>

            <h6 class="text-start fw-bold mb-2"><i class="pi pi-qrcode me-2"></i>Credencial QR de Acceso</h6>
            <div class="p-3 bg-light rounded text-center" *ngIf="qrData">
              <div class="bg-white p-2 d-inline-block rounded border mb-2">
                <i class="pi pi-qrcode" style="font-size: 5rem; color: #1e293b;"></i>
              </div>
              <div class="small fw-bold text-truncate">{{ qrData.tokenAcceso }}</div>
              <small class="text-muted d-block mt-1">Valido para torniquetes autorizados</small>
            </div>
          </div>
        </div>

        <div class="col-md-8">
          <div class="card shadow-sm border-0 mb-4">
            <div class="card-header bg-white py-3">
              <h5 class="mb-0 fw-bold"><i class="pi pi-shield me-2 text-primary"></i>Enrolamiento Biometrico Dual</h5>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <div class="p-3 border rounded">
                    <div class="d-flex align-items-center mb-2">
                      <i class="pi pi-id-card fs-4 text-primary me-2"></i>
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
                  <div class="p-3 border rounded">
                    <div class="d-flex align-items-center mb-2">
                      <i class="pi pi-camera fs-4 text-info me-2"></i>
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

          <div class="card shadow-sm border-0">
            <div class="card-header bg-white py-3">
              <h5 class="mb-0 fw-bold"><i class="pi pi-building me-2 text-success"></i>Pisos y Zonas Autorizadas</h5>
            </div>
            <div class="card-body">
              <div *ngIf="cliente.pisosPermitidos && cliente.pisosPermitidos.length > 0; else noPisos">
                <span class="badge bg-primary me-2 p-2" *ngFor="let p of cliente.pisosPermitidos">
                  <i class="pi pi-map-marker me-1"></i>{{ p.nombre }}
                </span>
              </div>
              <ng-template #noPisos>
                <p class="text-muted mb-0"><i class="pi pi-info-circle me-1"></i>Acceso general a pisos estandar de clientes.</p>
              </ng-template>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ClienteDetailsComponent implements OnInit {
  cliente?: Cliente;
  qrData?: any;

  constructor(
    private route: ActivatedRoute,
    private clienteService: ClienteService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.clienteService.getCliente(id).subscribe({
        next: (data) => (this.cliente = data),
        error: (err) => console.error('Error al cargar detalle de cliente:', err)
      });
      this.clienteService.getTokenQr(id).subscribe({
        next: (qr) => (this.qrData = qr),
        error: (err) => console.error('Error al cargar QR de cliente:', err)
      });
    }
  }
}
