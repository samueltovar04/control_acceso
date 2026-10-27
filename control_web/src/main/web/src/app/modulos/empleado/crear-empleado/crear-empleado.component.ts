import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmpleadoService } from '../../../shared/empleado/empleado.service';
import { Empleado } from '../../../shared/empleado/empleado.model';
import { BiometricCaptureComponent } from '../../../shared/components/biometric-capture/biometric-capture.component';
import { SedeService, Sede } from '../../../shared/sede/sede.service';
import { SedeStateService } from '../../../shared/sede/sede-state.service';
import { AuthService } from '../../../core/services/auth.service';
import { GerenciaService, Gerencia } from '../../../shared/gerencia/gerencia.service';
import { TipoContratoService, TipoContrato } from '../../../shared/tipo-contrato/tipo-contrato.service';
import { AlertModalService } from '../../../shared/services/alert-modal.service';
import { Subscription } from 'rxjs';

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

  sedeBloqueada: boolean = false;
  private subs: Subscription[] = [];

  submitted = false;
  guardando = false;

  constructor(
    private empleService: EmpleadoService,
    private sedeService: SedeService,
    private sedeStateService: SedeStateService,
    private authService: AuthService,
    private gerenciaService: GerenciaService,
    private tipoContratoService: TipoContratoService,
    private router: Router,
    private alertModal: AlertModalService
  ) {}

  ngOnInit(): void {
    this.sedeBloqueada = this.sedeStateService.esSedeBloqueada() || this.authService.hasSedeRestringida();
    const sedeActual = this.sedeStateService.getSedeActualId();
    if (sedeActual) {
      this.employee.sedeId = sedeActual;
    }

    this.subs.push(
      this.sedeStateService.sedeSeleccionadaId$.subscribe(id => {
        if (id && (!this.employee.sedeId || this.sedeBloqueada)) {
          this.employee.sedeId = id;
        }
      })
    );

    this.subs.push(
      this.sedeStateService.sedeBloqueada$.subscribe(bloq => {
        this.sedeBloqueada = bloq || this.authService.hasSedeRestringida();
      })
    );

    this.cargarCatalogos();
  }

  cargarCatalogos(): void {
    this.sedeService.getListSedes().subscribe({
      next: (data) => {
        this.sedesList = data || [];
        if (!this.employee.sedeId && this.sedesList.length > 0) {
          const sedeActual = this.sedeStateService.getSedeActualId();
          this.employee.sedeId = sedeActual || this.sedesList[0].id;
        }
      },
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
        const msg = err?.error?.error || err?.error?.message || err?.message || 'Error al registrar el empleado en la base de datos.';
        await this.alertModal.error(msg, 'Error al Registrar');
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
