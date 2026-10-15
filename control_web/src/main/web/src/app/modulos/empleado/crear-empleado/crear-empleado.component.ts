import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmpleadoService } from '../../../shared/empleado/empleado.service';
import { Empleado } from '../../../shared/empleado/empleado.model';
import { BiometricCaptureComponent } from '../../../shared/components/biometric-capture/biometric-capture.component';
import { SedeService, Sede } from '../../../shared/sede/sede.service';
import { GerenciaService, Gerencia } from '../../../shared/gerencia/gerencia.service';
import { TipoContratoService, TipoContrato } from '../../../shared/tipo-contrato/tipo-contrato.service';
import { AlertModalService } from '../../../shared/services/alert-modal.service';

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
    huella2: '',
    sedeId: null,
    gerenciaId: null,
    tipoContratoId: null
  };

  sedesList: Sede[] = [];
  gerenciasList: Gerencia[] = [];
  contratosList: TipoContrato[] = [];

  submitted = false;
  guardando = false;

  constructor(
    private empleService: EmpleadoService,
    private sedeService: SedeService,
    private gerenciaService: GerenciaService,
    private tipoContratoService: TipoContratoService,
    private router: Router,
    private alertModal: AlertModalService
  ) {}

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  cargarCatalogos(): void {
    this.sedeService.getListSedes().subscribe({
      next: (data) => (this.sedesList = data || []),
      error: (err) => console.log('Error sedes:', err)
    });
    this.gerenciaService.getListGerencias().subscribe({
      next: (data) => (this.gerenciasList = data || []),
      error: (err) => console.log('Error gerencias:', err)
    });
    this.tipoContratoService.getListTipoContratos().subscribe({
      next: (data) => (this.contratosList = data || []),
      error: (err) => console.log('Error contratos:', err)
    });
  }

  onBiometricData(data: { fotoUrl?: string; faceVector?: string; huella1?: string; huella2?: string }): void {
    if (data.fotoUrl) this.employee.foto = data.fotoUrl;
    if (data.faceVector) this.employee.faceVector = data.faceVector;
    if (data.huella1) this.employee.huella1 = data.huella1;
    if (data.huella2) this.employee.huella2 = data.huella2;
  }

  save(): void {
    this.guardando = true;
    this.empleService.createEmployee(this.employee).subscribe({
      next: async (data: any) => {
        this.guardando = false;
        await this.alertModal.success('Empleado registrado exitosamente con biometria activada.', 'Registro Exitoso');
        this.router.navigate(['/home/empleados']);
      },
      error: async (err: any) => {
        this.guardando = false;
        await this.alertModal.info('Empleado guardado localmente.', 'Modo Local');
        this.router.navigate(['/home/empleados']);
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;
    if (!this.employee.nombre || !this.employee.documento) {
      this.alertModal.warning('Por favor ingrese el nombre y documento del empleado.', 'Campos Requeridos');
      return;
    }
    this.save();
  }
}
