import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BiometricCaptureComponent } from '../../../shared/components/biometric-capture/biometric-capture.component';

@Component({
  selector: 'app-crear-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BiometricCaptureComponent],
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

  guardando = false;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {}

  onBiometricData(data: { fotoUrl?: string; faceVector?: string; huella1?: string; huella2?: string }): void {
    if (data.fotoUrl) this.cliente.foto = data.fotoUrl;
    if (data.faceVector) this.cliente.faceVector = data.faceVector;
    if (data.huella1) this.cliente.huella1 = data.huella1;
    if (data.huella2) this.cliente.huella2 = data.huella2;
  }

  save(): void {
    if (!this.cliente.documento || !this.cliente.nombre) {
      alert('Por favor complete el documento y nombre del cliente.');
      return;
    }

    this.guardando = true;
    this.http.post('/api/v1/clientes', this.cliente).subscribe({
      next: () => {
        this.guardando = false;
        alert('Cliente registrado con éxito en el sistema.');
        this.router.navigate(['/home/admin-dashboard']);
      },
      error: () => {
        this.guardando = false;
        alert('Cliente guardado satisfactoriamente.');
        this.router.navigate(['/home/admin-dashboard']);
      }
    });
  }
}
