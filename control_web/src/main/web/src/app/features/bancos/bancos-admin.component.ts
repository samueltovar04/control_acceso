import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BancoService, Banco } from '../../core/services/banco.service';
import { AlertModalService } from '../../shared/services/alert-modal.service';

@Component({
  selector: 'app-bancos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './bancos-admin.component.html',
  styleUrls: ['./bancos-admin.component.scss']
})
export class BancosAdminComponent implements OnInit {
  private bancoService = inject(BancoService);
  private fb = inject(FormBuilder);
  private alertModal = inject(AlertModalService);

  bancos = signal<Banco[]>([]);
  cargando = signal<boolean>(false);
  filtroTipo = signal<string>('TODOS');
  mostrarModal = signal<boolean>(false);
  editandoId: number | null = null;
  copiadoTexto: string | null = null;

  form: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    codigo: [''],
    tipo: ['PAGO_MOVIL', Validators.required],
    numeroCuenta: [''],
    titular: ['', Validators.required],
    documentoTitular: [''],
    telefono: [''],
    email: [''],
    red: [''],
    direccionBilletera: [''],
    memoQr: [''],
    moneda: ['VES', Validators.required],
    notasInstruccion: [''],
    activo: [true]
  });

  ngOnInit(): void {
    this.cargarBancos();
  }

  cargarBancos(): void {
    this.cargando.set(true);
    this.bancoService.getTodos().subscribe({
      next: (data) => {
        this.bancos.set(data || []);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar bancos:', err);
        this.cargando.set(false);
      }
    });
  }

  get bancosFiltrados(): Banco[] {
    const tipo = this.filtroTipo();
    if (tipo === 'TODOS') {
      return this.bancos();
    }
    return this.bancos().filter(b => b.tipo === tipo);
  }

  cambiarFiltro(tipo: string): void {
    this.filtroTipo.set(tipo);
  }

  abrirModalNuevo(): void {
    this.editandoId = null;
    this.form.reset({
      nombre: '',
      codigo: '',
      tipo: 'PAGO_MOVIL',
      numeroCuenta: '',
      titular: '',
      documentoTitular: '',
      telefono: '',
      email: '',
      red: '',
      direccionBilletera: '',
      memoQr: '',
      moneda: 'VES',
      notasInstruccion: '',
      activo: true
    });
    this.mostrarModal.set(true);
  }

  abrirModalEditar(banco: Banco): void {
    this.editandoId = banco.id || null;
    this.form.patchValue({
      nombre: banco.nombre,
      codigo: banco.codigo || '',
      tipo: banco.tipo,
      numeroCuenta: banco.numeroCuenta || '',
      titular: banco.titular || '',
      documentoTitular: banco.documentoTitular || '',
      telefono: banco.telefono || '',
      email: banco.email || '',
      red: banco.red || '',
      direccionBilletera: banco.direccionBilletera || '',
      memoQr: banco.memoQr || '',
      moneda: banco.moneda || 'VES',
      notasInstruccion: banco.notasInstruccion || '',
      activo: banco.activo !== undefined ? banco.activo : true
    });
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
    this.editandoId = null;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: Banco = this.form.value;

    if (this.editandoId) {
      this.bancoService.actualizarBanco(this.editandoId, payload).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarBancos();
          this.alertModal.success('Cuenta bancaria actualizada correctamente.', 'Guardado');
        },
        error: (err) => this.alertModal.error('Error al actualizar cuenta bancaria: ' + err.message, 'Error')
      });
    } else {
      this.bancoService.crearBanco(payload).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarBancos();
          this.alertModal.success('Cuenta bancaria registrada correctamente.', 'Guardado');
        },
        error: (err) => this.alertModal.error('Error al registrar cuenta bancaria: ' + err.message, 'Error')
      });
    }
  }

  toggleEstado(banco: Banco): void {
    if (!banco.id) return;
    const nuevoEstado = !banco.activo;
    this.bancoService.actualizarBanco(banco.id, { ...banco, activo: nuevoEstado }).subscribe({
      next: () => this.cargarBancos(),
      error: (err) => console.error('Error al cambiar estado:', err)
    });
  }

  copiarAlPortapapeles(texto?: string): void {
    if (!texto) return;
    navigator.clipboard.writeText(texto).then(() => {
      this.copiadoTexto = texto;
      setTimeout(() => (this.copiadoTexto = null), 2000);
    });
  }
}
