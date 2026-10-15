import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BiometricCaptureComponent } from '../../../shared/components/biometric-capture/biometric-capture.component';
import { BcvConvertPipe } from '../../../shared/pipes/bcv-convert.pipe';
import { AlertModalService } from '../../../shared/services/alert-modal.service';

@Component({
  selector: 'app-crear-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BiometricCaptureComponent, BcvConvertPipe],
  templateUrl: './crear-cliente.component.html',
  styleUrls: ['./crear-cliente.component.css']
})
export class CrearClienteComponent implements OnInit {
  cliente: any = {
    documento: '',
    codigoInsignia: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    sexo: 'M',
    foto: '',
    faceVector: '',
    huella1: '',
    huella2: '',
    estadoSuscripcion: 'ACTIVA'
  };

  membresiasList: any[] = [];
  membresiaSeleccionadaId: number | null = null;
  guardando = false;

  get membresiaSeleccionada(): any {
    return this.membresiasList.find(m => m.id === this.membresiaSeleccionadaId);
  }

  constructor(
    private http: HttpClient,
    private router: Router,
    private alertModal: AlertModalService
  ) {}

  ngOnInit(): void {
    this.cargarMembresias();
  }

  cargarMembresias(): void {
    this.http.get<any[]>('/api/v1/membresias').subscribe({
      next: (data) => {
        this.membresiasList = data || [];
        if (this.membresiasList.length > 0) {
          this.membresiaSeleccionadaId = this.membresiasList[0].id;
        }
      },
      error: (err) => console.error('Error al cargar membresias:', err)
    });
  }

  onBiometricData(data: { fotoUrl?: string; faceVector?: string; huella1?: string; huella2?: string }): void {
    if (data.fotoUrl) this.cliente.foto = data.fotoUrl;
    if (data.faceVector) this.cliente.faceVector = data.faceVector;
    if (data.huella1) this.cliente.huella1 = data.huella1;
    if (data.huella2) this.cliente.huella2 = data.huella2;
  }

  async save(): Promise<void> {
    if (!this.cliente.documento || !this.cliente.nombre) {
      this.alertModal.warning('Por favor complete el documento y nombre del cliente.', 'Campos Requeridos');
      return;
    }

    if (this.membresiaSeleccionadaId) {
      const mem = this.membresiasList.find(m => m.id === Number(this.membresiaSeleccionadaId));
      if (mem) {
        this.cliente.membresiaActual = mem;
      }
    }

    this.guardando = true;
    this.http.post<any>('/api/v1/clientes', this.cliente).subscribe({
      next: async (creado) => {
        this.guardando = false;
        await this.alertModal.success('Cliente registrado con exito en el sistema.', 'Registro Exitoso');
        this.router.navigate(['/home/clientes']);
      },
      error: (err) => {
        this.guardando = false;
        console.error('Error al guardar cliente:', err);
        this.alertModal.error('Error al guardar cliente en el servidor: ' + (err.error?.error || err.message || 'Error desconocido'), 'Error al Registrar');
      }
    });
  }
}
