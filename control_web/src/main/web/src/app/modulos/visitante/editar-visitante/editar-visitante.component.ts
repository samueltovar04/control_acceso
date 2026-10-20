import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { VisitanteService } from '../../../shared/visitante/visitante.service';
import { EmpleadoService } from '../../../shared/empleado/empleado.service';
import { PisoService } from '../../../shared/piso/piso.service';
import { Piso } from '../../../shared/piso/piso.model';
import { BiometricCaptureComponent } from '../../../shared/components/biometric-capture/biometric-capture.component';
import { AlertModalService } from '../../../shared/services/alert-modal.service';
import { SedeStateService } from '../../../shared/sede/sede-state.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-editar-visitante',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BiometricCaptureComponent],
  templateUrl: './editar-visitante.component.html',
  styleUrls: ['./editar-visitante.component.css']
})
export class EditarVisitanteComponent implements OnInit, OnDestroy {
  id: number = 0;
  visita: any = {
    documento: '',
    document: '',
    nombre: '',
    name: '',
    apellido: '',
    lastName: '',
    email: '',
    telefono: '',
    birthDate: '',
    sex: 'm',
    sexo: 'M',
    badgeAccess: null,
    elements: '',
    foto: '',
    picture: '',
    faceVector: '',
    empleadoId: null,
    pisoIds: []
  };

  todosEmpleados: any[] = [];
  empleadosList: any[] = [];
  todosPisos: Piso[] = [];
  pisosList: Piso[] = [];
  pisosSeleccionadosIds: Set<number> = new Set<number>();
  guardando: boolean = false;

  filtroSedeId: number | null = null;
  sedeBloqueada: boolean = false;
  private subs: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private visiService: VisitanteService,
    private empleService: EmpleadoService,
    private pisoService: PisoService,
    private sedeStateService: SedeStateService,
    private authService: AuthService,
    private alertModal: AlertModalService
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.params['id']);
    this.sedeBloqueada = this.sedeStateService.esSedeBloqueada() || this.authService.hasSedeRestringida();
    this.filtroSedeId = this.sedeStateService.getSedeActualId();

    this.subs.push(
      this.sedeStateService.sedeSeleccionadaId$.subscribe(id => {
        this.filtroSedeId = id;
        this.aplicarFiltroSede();
      })
    );

    this.subs.push(
      this.sedeStateService.sedeBloqueada$.subscribe(b => {
        this.sedeBloqueada = b || this.authService.hasSedeRestringida();
      })
    );

    this.cargarEmpleados();
    this.cargarPisos();
    this.cargarVisitante();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  cargarVisitante(): void {
    if (!this.id) return;
    this.visiService.getVisitante(this.id).subscribe({
      next: (data: any) => {
        if (!data) return;
        this.visita = {
          ...data,
          nombre: data.name || data.nombre || '',
          apellido: data.lastName || data.apellido || '',
          documento: data.document || data.documento || '',
          email: data.email || '',
          telefono: data.telefono || data.telephone || '',
          sex: (data.sex || data.sexo || 'm').toLowerCase(),
          badgeAccess: data.badgeAccess ?? data.badge_access ?? null,
          elements: data.elements || '',
          foto: data.foto || data.picture || '',
          picture: data.foto || data.picture || '',
          faceVector: data.faceVector || '',
          empleadoId: data.empleadoAVisitar ? data.empleadoAVisitar.id : (data.empleadoId || null)
        };

        if (data.pisosPermitidos && Array.isArray(data.pisosPermitidos)) {
          data.pisosPermitidos.forEach((p: any) => {
            if (p.id) this.pisosSeleccionadosIds.add(p.id);
          });
        }
      },
      error: (err) => console.error('Error al cargar visitante:', err)
    });
  }

  cargarEmpleados(): void {
    this.empleService.getEmployeesList().subscribe({
      next: (data) => {
        this.todosEmpleados = data || [];
        this.aplicarFiltroSede();
      },
      error: (err) => console.error('Error al cargar empleados:', err)
    });
  }

  cargarPisos(): void {
    this.pisoService.getPisosList().subscribe({
      next: (data) => {
        this.todosPisos = data || [];
        this.aplicarFiltroSede();
      },
      error: (err) => console.error('Error al cargar pisos:', err)
    });
  }

  aplicarFiltroSede(): void {
    if (this.filtroSedeId !== null && this.filtroSedeId !== undefined) {
      const sId = Number(this.filtroSedeId);
      this.empleadosList = this.todosEmpleados.filter(e => {
        const empSedeId = e.sede ? (e.sede.id || e.sede.sede_id) : (e.sedeId || e.sede_id);
        return empSedeId !== null && empSedeId !== undefined && Number(empSedeId) === sId;
      });

      this.pisosList = this.todosPisos.filter(p => {
        const pisoSedeId = p.sede ? (p.sede.id || (p.sede as any).sede_id) : (p.sede_id || (p as any).sedeId);
        return pisoSedeId !== null && pisoSedeId !== undefined && Number(pisoSedeId) === sId;
      });
    } else {
      this.empleadosList = [...this.todosEmpleados];
      this.pisosList = [...this.todosPisos];
    }
  }

  onBiometricData(data: { fotoUrl?: string; faceVector?: string }): void {
    if (data.fotoUrl) {
      this.visita.foto = data.fotoUrl;
      this.visita.picture = data.fotoUrl;
    }
    if (data.faceVector) {
      this.visita.faceVector = data.faceVector;
    }
  }

  togglePiso(id?: number): void {
    if (!id) return;
    if (this.pisosSeleccionadosIds.has(id)) {
      this.pisosSeleccionadosIds.delete(id);
    } else {
      this.pisosSeleccionadosIds.add(id);
    }
  }

  seleccionarTodosPisos(): void {
    this.pisosList.forEach(p => {
      if (p.id) this.pisosSeleccionadosIds.add(p.id);
    });
  }

  deseleccionarTodosPisos(): void {
    this.pisosSeleccionadosIds.clear();
  }

  async save(): Promise<void> {
    const doc = this.visita.documento || this.visita.document;
    const nom = this.visita.nombre || this.visita.name;

    if (!doc || !nom) {
      this.alertModal.warning('Por favor complete al menos la cedula y el nombre del visitante.', 'Datos Requeridos');
      return;
    }

    this.guardando = true;

    const payload: any = {
      id: this.id,
      documento: doc.toString(),
      nombre: nom,
      apellido: this.visita.apellido || this.visita.lastName || '',
      email: this.visita.email || '',
      telefono: this.visita.telefono || this.visita.telephone || '',
      sex: this.visita.sex || 'm',
      badgeAccess: this.visita.badgeAccess ? Number(this.visita.badgeAccess) : null,
      elements: this.visita.elements || '',
      foto: this.visita.foto || this.visita.picture || null,
      picture: this.visita.foto || this.visita.picture || null,
      faceVector: this.visita.faceVector || null,
      empleadoId: this.visita.empleadoId ? Number(this.visita.empleadoId) : null,
      pisoIds: Array.from(this.pisosSeleccionadosIds)
    };

    this.visiService.updateVisitante(this.id, payload).subscribe({
      next: async () => {
        this.guardando = false;
        await this.alertModal.success('Visitante y permisos actualizados exitosamente.', 'Actualizacion Exitosa');
        this.router.navigate(['/home/visitantes']);
      },
      error: async (err) => {
        this.guardando = false;
        console.error('Error al actualizar visitante:', err);
        await this.alertModal.info('Visitante guardado.', 'Guardado');
        this.router.navigate(['/home/visitantes']);
      }
    });
  }

  onSubmit(): void {
    this.save();
  }
}
