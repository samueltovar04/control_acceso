import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MultiCurrencyFormatPipe } from '../../shared/pipes/multi-currency-format.pipe';
import { BcvConvertPipe } from '../../shared/pipes/bcv-convert.pipe';
import { TasaCambioService } from '../../core/services/tasa-cambio.service';

export interface Membresia {
  id?: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  duracionesDias?: number;
  duracionDias?: number;
  periodicidad?: string;
  ciclo?: 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | 'TRIMESTRAL' | 'ANUAL';
  moneda?: 'USD' | 'EUR';
  activo?: boolean;
  activa?: boolean;
}

export interface Promocion {
  id?: number;
  nombre: string;
  codigo: string;
  tipoDescuento: 'PORCENTAJE' | 'MONTO_FIJO' | 'DOS_POR_UNO' | 'DIAS_EXTRA';
  valorDescuento: number;
  fechaInicio?: string;
  fechaFin?: string;
  activo: boolean;
  membresiaAplica?: Membresia | null;
}

@Component({
  selector: 'app-membresia-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatSnackBarModule, MultiCurrencyFormatPipe, BcvConvertPipe],
  templateUrl: './membresia-catalogo.component.html',
  styleUrls: ['./membresia-catalogo.component.scss']
})
export class MembresiaCatalogoComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  tasaService = inject(TasaCambioService);

  seccionActiva = signal<'planes' | 'promociones'>('planes');

  membresias = signal<Membresia[]>([]);
  promociones = signal<Promocion[]>([]);
  cargando = signal<boolean>(false);
  cargandoPromos = signal<boolean>(false);

  mostrarModal = signal<boolean>(false);
  mostrarModalPromo = signal<boolean>(false);
  mostrarModalConfirmacion = signal<boolean>(false);
  promoSeleccionadaConfirmacion = signal<Promocion | null>(null);
  accionConfirmacion = signal<'inactivar' | 'activar'>('inactivar');

  editandoId: number | null = null;
  editandoPromoId: number | null = null;

  form: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: [''],
    precio: [null, [Validators.required, Validators.min(0.01)]],
    duracionDias: [30, [Validators.required, Validators.min(1)]],
    ciclo: ['MENSUAL', Validators.required],
    moneda: ['USD', Validators.required],
    activa: [true]
  });

  promoForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    codigo: ['', [Validators.required, Validators.minLength(3)]],
    tipoDescuento: ['PORCENTAJE', Validators.required],
    valorDescuento: [10, [Validators.required, Validators.min(0)]],
    membresiaAplicaId: [null],
    fechaInicio: [''],
    fechaFin: [''],
    activo: [true]
  });

  ngOnInit(): void {
    this.cargarMembresias();
    this.cargarPromociones();
  }

  cargarMembresias(): void {
    this.cargando.set(true);
    this.http.get<Membresia[]>('/api/v1/membresias').subscribe({
      next: (data) => {
        this.membresias.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  cargarPromociones(): void {
    this.cargandoPromos.set(true);
    this.http.get<Promocion[]>('/api/v1/membresias/promociones?incluirInactivas=true').subscribe({
      next: (data) => {
        this.promociones.set(data);
        this.cargandoPromos.set(false);
      },
      error: () => this.cargandoPromos.set(false)
    });
  }

  onCicloChange(): void {
    const ciclo = this.form.get('ciclo')?.value;
    switch (ciclo) {
      case 'SEMANAL':
        this.form.patchValue({ duracionDias: 7 });
        break;
      case 'QUINCENAL':
        this.form.patchValue({ duracionDias: 15 });
        break;
      case 'MENSUAL':
        this.form.patchValue({ duracionDias: 30 });
        break;
      case 'TRIMESTRAL':
        this.form.patchValue({ duracionDias: 90 });
        break;
      case 'ANUAL':
        this.form.patchValue({ duracionDias: 365 });
        break;
    }
  }

  abrirCrear(): void {
    this.editandoId = null;
    this.form.reset({
      nombre: '',
      descripcion: '',
      precio: null,
      duracionDias: 30,
      ciclo: 'MENSUAL',
      moneda: 'USD',
      activa: true
    });
    this.mostrarModal.set(true);
  }

  abrirEditar(m: Membresia): void {
    this.editandoId = m.id || null;
    this.form.patchValue({
      nombre: m.nombre,
      descripcion: m.descripcion || '',
      precio: m.precio,
      duracionDias: m.duracionesDias || m.duracionDias || 30,
      ciclo: m.periodicidad || m.ciclo || 'MENSUAL',
      moneda: m.moneda || 'USD',
      activa: m.activo !== false && m.activa !== false
    });
    this.mostrarModal.set(true);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const fv = this.form.value;
    const payload = {
      nombre: fv.nombre,
      descripcion: fv.descripcion,
      precio: fv.precio,
      duracionesDias: fv.duracionDias,
      periodicidad: fv.ciclo,
      activo: fv.activa
    };

    if (this.editandoId) {
      this.http.put(`/api/v1/membresias/${this.editandoId}`, payload).subscribe({
        next: () => {
          this.snackBar.open('Membresia actualizada', 'OK', { duration: 3000 });
          this.mostrarModal.set(false);
          this.cargarMembresias();
        },
        error: () => this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 4000 })
      });
    } else {
      this.http.post('/api/v1/membresias', payload).subscribe({
        next: () => {
          this.snackBar.open('Membresia creada con exito', 'OK', { duration: 3000 });
          this.mostrarModal.set(false);
          this.cargarMembresias();
        },
        error: () => this.snackBar.open('Error al crear membresia', 'Cerrar', { duration: 4000 })
      });
    }
  }

  // --- LOGICA DE PROMOCIONES Y CUPONES ---
  abrirCrearPromo(): void {
    this.editandoPromoId = null;
    this.promoForm.reset({
      nombre: '',
      codigo: '',
      tipoDescuento: 'PORCENTAJE',
      valorDescuento: 10,
      membresiaAplicaId: null,
      fechaInicio: '',
      fechaFin: '',
      activo: true
    });
    this.mostrarModalPromo.set(true);
  }

  abrirEditarPromo(p: Promocion): void {
    this.editandoPromoId = p.id || null;
    this.promoForm.patchValue({
      nombre: p.nombre,
      codigo: p.codigo,
      tipoDescuento: p.tipoDescuento,
      valorDescuento: p.valorDescuento,
      membresiaAplicaId: p.membresiaAplica ? p.membresiaAplica.id : null,
      fechaInicio: p.fechaInicio ? p.fechaInicio.substring(0, 10) : '',
      fechaFin: p.fechaFin ? p.fechaFin.substring(0, 10) : '',
      activo: p.activo
    });
    this.mostrarModalPromo.set(true);
  }

  guardarPromo(): void {
    if (this.promoForm.invalid) {
      this.promoForm.markAllAsTouched();
      return;
    }

    const v = this.promoForm.value;
    const payload: any = {
      nombre: v.nombre,
      codigo: v.codigo.trim().toUpperCase(),
      tipoDescuento: v.tipoDescuento,
      valorDescuento: v.valorDescuento,
      fechaInicio: v.fechaInicio ? v.fechaInicio : null,
      fechaFin: v.fechaFin ? v.fechaFin : null,
      activo: v.activo,
      membresiaAplica: v.membresiaAplicaId ? { id: v.membresiaAplicaId } : null
    };

    if (this.editandoPromoId) {
      this.http.put(`/api/v1/membresias/promociones/${this.editandoPromoId}`, payload).subscribe({
        next: () => {
          this.snackBar.open('Promocion actualizada', 'OK', { duration: 3000 });
          this.mostrarModalPromo.set(false);
          this.cargarPromociones();
        },
        error: () => this.snackBar.open('Error al actualizar promocion', 'Cerrar', { duration: 4000 })
      });
    } else {
      this.http.post('/api/v1/membresias/promociones', payload).subscribe({
        next: () => {
          this.snackBar.open('Promocion creada con exito', 'OK', { duration: 3000 });
          this.mostrarModalPromo.set(false);
          this.cargarPromociones();
        },
        error: () => this.snackBar.open('Error al crear promocion', 'Cerrar', { duration: 4000 })
      });
    }
  }

  solicitarConfirmacionToggle(p: Promocion): void {
    if (!p || !p.id) return;
    this.promoSeleccionadaConfirmacion.set(p);
    this.accionConfirmacion.set(p.activo ? 'inactivar' : 'activar');
    this.mostrarModalConfirmacion.set(true);
  }

  cancelarConfirmacion(): void {
    this.mostrarModalConfirmacion.set(false);
    this.promoSeleccionadaConfirmacion.set(null);
  }

  confirmarTogglePromo(): void {
    const p = this.promoSeleccionadaConfirmacion();
    if (!p || !p.id) return;

    this.http.patch(`/api/v1/membresias/promociones/${p.id}/toggle-activo`, {}).subscribe({
      next: (resp: any) => {
        const estadoTexto = resp.activo ? 'activada' : 'inactivada';
        this.snackBar.open(`Promocion ${p.codigo} ${estadoTexto} exitosamente`, 'OK', { duration: 3500 });
        this.cancelarConfirmacion();
        this.cargarPromociones();
      },
      error: () => {
        this.snackBar.open('Error al cambiar estado de la promocion', 'Cerrar', { duration: 4000 });
        this.cancelarConfirmacion();
      }
    });
  }
}

