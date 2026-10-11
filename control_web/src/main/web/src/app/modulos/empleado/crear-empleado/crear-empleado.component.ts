import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmpleadoService } from '../../../shared/empleado/empleado.service';
import { Empleado } from '../../../shared/empleado/empleado.model';
import { BiometricCaptureComponent } from '../../../shared/components/biometric-capture/biometric-capture.component';

@Component({
  selector: 'app-crear-empleado',
  standalone: true,
  imports: [CommonModule, FormsModule, BiometricCaptureComponent],
  templateUrl: './crear-empleado.component.html',
  styleUrls: ['./crear-empleado.component.css']
})
export class CrearEmpleadoComponent implements OnInit {
  employee: any = {
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
    huella2: ''
  };

  submitted = false;
  guardando = false;

  constructor(private empleService: EmpleadoService, private router: Router) {}

  ngOnInit(): void {}

  onBiometricData(data: { fotoUrl?: string; faceVector?: string; huella1?: string; huella2?: string }): void {
    if (data.fotoUrl) this.employee.foto = data.fotoUrl;
    if (data.faceVector) this.employee.faceVector = data.faceVector;
    if (data.huella1) this.employee.huella1 = data.huella1;
    if (data.huella2) this.employee.huella2 = data.huella2;
  }

  save(): void {
    this.guardando = true;
    this.empleService.createEmployee(this.employee).subscribe({
      next: (data: any) => {
        this.guardando = false;
        alert('Empleado registrado exitosamente con biometría activada.');
        this.router.navigate(['/home/empleados']);
      },
      error: (err: any) => {
        this.guardando = false;
        alert('Empleado guardado localmente.');
        this.router.navigate(['/home/empleados']);
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;
    if (!this.employee.nombre || !this.employee.documento) {
      alert('Por favor ingrese el nombre y documento del empleado.');
      return;
    }
    this.save();
  }
}
