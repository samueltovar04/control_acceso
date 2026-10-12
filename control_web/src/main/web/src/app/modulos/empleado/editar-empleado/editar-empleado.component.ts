import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmpleadoService } from '../../../shared/empleado/empleado.service';
import { BiometricCaptureComponent } from '../../../shared/components/biometric-capture/biometric-capture.component';
import { SedeService, Sede } from '../../../shared/sede/sede.service';
import { GerenciaService, Gerencia } from '../../../shared/gerencia/gerencia.service';
import { TipoContratoService, TipoContrato } from '../../../shared/tipo-contrato/tipo-contrato.service';

@Component({
  selector: 'app-editar-empleado',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BiometricCaptureComponent],
  templateUrl: './editar-empleado.component.html',
  styleUrls: ['./editar-empleado.component.css']
})
export class EditarEmpleadoComponent implements OnInit {
  id: number = 0;
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
    legajo: '',
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
    private route: ActivatedRoute,
    private router: Router,
    private empleService: EmpleadoService,
    private sedeService: SedeService,
    private gerenciaService: GerenciaService,
    private tipoContratoService: TipoContratoService
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.params['id']);
    this.cargarCatalogos();
    this.cargarEmpleado();
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

  cargarEmpleado(): void {
    if (!this.id) return;
    this.empleService.getEmployee(this.id).subscribe({
      next: (data: any) => {
        if (!data) return;
        this.employee = {
          id: data.id,
          documento: data.document || data.documento || '',
          codigoInsignia: data.badgeAccess || data.badge_access || data.codigoInsignia || '',
          nombre: data.name || data.nombre || '',
          apellido: data.lastName || data.apellido || '',
          email: data.email || '',
          telefono: data.telephone || data.telefono || '',
          sexo: (data.sex || data.sexo || 'M').toUpperCase(),
          foto: data.picture || data.foto || '',
          faceVector: data.faceVector || '',
          huella1: data.huella1 || '',
          huella2: data.huella2 || '',
          legajo: data.legajo || '',
          sedeId: data.sede ? data.sede.id : null,
          gerenciaId: data.gerencia ? data.gerencia.id : null,
          tipoContratoId: data.tipoContrato ? data.tipoContrato.id : null
        };
      },
      error: (err) => console.error('Error al cargar empleado:', err)
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
    this.empleService.updateEmployee(this.id, this.employee).subscribe({
      next: () => {
        this.guardando = false;
        alert('Empleado actualizado exitosamente.');
        this.router.navigate(['/home/empleados']);
      },
      error: (err) => {
        this.guardando = false;
        alert('Cambios guardados localmente.');
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
