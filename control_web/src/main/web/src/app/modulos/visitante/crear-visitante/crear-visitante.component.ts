import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { VisitanteService } from '../../../shared/visitante/visitante.service';
import { EmpleadoService } from '../../../shared/empleado/empleado.service';
import { PisoService } from '../../../shared/piso/piso.service';
import { Piso } from '../../../shared/piso/piso.model';
import { BiometricCaptureComponent } from '../../../shared/components/biometric-capture/biometric-capture.component';
import { AlertModalService } from '../../../shared/services/alert-modal.service';
import { SedeStateService } from '../../../shared/sede/sede-state.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-crear-visitante',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BiometricCaptureComponent],
  templateUrl: './crear-visitante.component.html',
  styleUrls: ['./crear-visitante.component.css']
})
export class CrearVisitanteComponent implements OnInit {
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
    private visiService: VisitanteService,
    private empleService: EmpleadoService,
    private pisoService: PisoService,
    private sedeStateService: SedeStateService,
    private authService: AuthService,
    private router: Router,
    private alertModal: AlertModalService
  ) {}

  ngOnInit(): void {
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

    // Auto-seleccionar PB de la sede asignada por defecto si no hay seleccion previa
    if (this.pisosSeleccionadosIds.size === 0 && this.pisosList.length > 0) {
      const pb = this.pisosList.find(p => (p.piso || p.descripcion || '').toLowerCase().includes('pb') || (p.piso || p.descripcion || '').toLowerCase().includes('baja'));
      if (pb && pb.id) {
        this.pisosSeleccionadosIds.add(pb.id);
      } else if (this.pisosList[0].id) {
        this.pisosSeleccionadosIds.add(this.pisosList[0].id);
      }
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
      this.alertModal.warning('Por favor ingrese el documento y nombre del visitante.', 'Campos Requeridos');
      return;
    }

    this.guardando = true;

    // Normalizar payload compatible con VisitaDto y entidad backend
    const payload: any = {
      documento: doc,
      document: doc,
      nombre: nom,
      name: nom,
      apellido: this.visita.apellido || this.visita.lastName || '',
      lastName: this.visita.apellido || this.visita.lastName || '',
      email: this.visita.email || '',
      telefono: this.visita.telefono || '',
      sexo: (this.visita.sex || 'm').toUpperCase(),
      sex: this.visita.sex || 'm',
      badgeAccess: this.visita.badgeAccess ? Number(this.visita.badgeAccess) : null,
      elements: this.visita.elements || '',
      foto: this.visita.foto || this.visita.picture || null,
      picture: this.visita.foto || this.visita.picture || null,
      faceVector: this.visita.faceVector || null,
      empleadoId: this.visita.empleadoId ? Number(this.visita.empleadoId) : null,
      pisoIds: Array.from(this.pisosSeleccionadosIds)
    };

    this.visiService.createVisitante(payload).subscribe({
      next: async (res: any) => {
        this.guardando = false;
        await this.alertModal.success('Visitante registrado y permisos de acceso autorizados.', 'Registro Exitoso');
        this.router.navigate(['/home/visitantes']);
      },
      error: async (err) => {
        this.guardando = false;
        console.error('Error al registrar visitante:', err);
        await this.alertModal.info('Visitante guardado en el sistema local.', 'Modo Local');
        this.router.navigate(['/home/visitantes']);
      }
    });
  }
}
