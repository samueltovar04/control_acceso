import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanzasService, Pago, Conciliacion, BalanceFinanciero, Gasto } from '../../core/services/finanzas.service';
import { AlertModalService } from '../../shared/services/alert-modal.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  private finanzasService = inject(FinanzasService);
  private alertModal = inject(AlertModalService);

  balance?: BalanceFinanciero;
  pagos: Pago[] = [];
  deudores: any[] = [];
  pendientesConciliacion: Pago[] = [];

  // Modales de Gastos
  mostrarModalNuevoGasto: boolean = false;
  mostrarModalListadoGastos: boolean = false;

  gastosMes: Gasto[] = [];
  cargandoGastos: boolean = false;
  guardandoGasto: boolean = false;
  mensajeGastoExito: string = '';
  errorGasto: string = '';

  nuevoGasto: Gasto = {
    descripcion: '',
    categoria: 'MANTENIMIENTO',
    monto: 0,
    fechaGasto: new Date().toISOString().slice(0, 10),
    registradoPor: 'Admin Finanzas'
  };

  // Formulario nuevo pago
  nuevoPago: Pago = {
    monto: 0,
    metodoPago: 'EFECTIVO' as any,
    origenPago: 'WEB_ADMIN',
    registradoPor: 'Admin Cajero',
    estadoPago: 'COMPLETADO'
  };

  clienteIdSeleccionado?: number;

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.finanzasService.getBalance().subscribe(b => this.balance = b);
    this.finanzasService.getPagos().subscribe(p => this.pagos = p);
    this.finanzasService.getDeudores().subscribe(d => this.deudores = d);
    this.finanzasService.getPendientesConciliacion().subscribe(pc => this.pendientesConciliacion = pc);
    this.cargarGastosMes();
  }

  cargarGastosMes(): void {
    this.cargandoGastos = true;
    this.finanzasService.getGastos().subscribe({
      next: (data) => {
        const ahora = new Date();
        const anioMesActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;
        
        this.gastosMes = (data || []).filter(g => {
          if (!g.fechaGasto) return false;
          return g.fechaGasto.startsWith(anioMesActual);
        });
        this.cargandoGastos = false;
      },
      error: () => {
        this.cargandoGastos = false;
      }
    });
  }

  abrirModalNuevoGasto(): void {
    this.mensajeGastoExito = '';
    this.errorGasto = '';
    this.nuevoGasto = {
      descripcion: '',
      categoria: 'MANTENIMIENTO',
      monto: 0,
      fechaGasto: new Date().toISOString().slice(0, 10),
      registradoPor: 'Admin Finanzas'
    };
    this.mostrarModalNuevoGasto = true;
  }

  cerrarModalNuevoGasto(): void {
    this.mostrarModalNuevoGasto = false;
  }

  abrirModalListadoGastos(): void {
    this.cargarGastosMes();
    this.mostrarModalListadoGastos = true;
  }

  cerrarModalListadoGastos(): void {
    this.mostrarModalListadoGastos = false;
  }

  guardarGasto(): void {
    this.errorGasto = '';
    this.mensajeGastoExito = '';

    if (!this.nuevoGasto.descripcion || !this.nuevoGasto.descripcion.trim()) {
      this.errorGasto = 'La descripcion del gasto es requerida.';
      return;
    }
    if (!this.nuevoGasto.monto || this.nuevoGasto.monto <= 0) {
      this.errorGasto = 'El monto del gasto debe ser mayor a 0.';
      return;
    }

    this.guardandoGasto = true;
    this.finanzasService.registrarGasto(this.nuevoGasto).subscribe({
      next: () => {
        this.mensajeGastoExito = 'Gasto operativo registrado exitosamente.';
        this.guardandoGasto = false;
        this.cargarDatos();
        setTimeout(() => {
          this.cerrarModalNuevoGasto();
        }, 1200);
      },
      error: () => {
        this.errorGasto = 'Error al registrar el gasto. Intente nuevamente.';
        this.guardandoGasto = false;
      }
    });
  }

  registrarPago(): void {
    if (!this.nuevoPago.monto || this.nuevoPago.monto <= 0) {
      this.alertModal.warning('Por favor ingrese un monto valido mayor a cero para el pago.', 'Monto Invalido');
      return;
    }

    if (this.clienteIdSeleccionado) {
      this.nuevoPago.cliente = { id: this.clienteIdSeleccionado };
    }
    this.finanzasService.registrarPago(this.nuevoPago).subscribe({
      next: () => {
        this.cargarDatos();
        this.alertModal.success(`Pago de $${this.nuevoPago.monto} registrado exitosamente.`, 'Pago Registrado');
        this.nuevoPago.monto = 0;
        this.nuevoPago.numeroReferencia = '';
      },
      error: (err) => {
        console.error('Error registrando pago:', err);
        this.alertModal.error('No se pudo registrar el pago.', 'Error');
      }
    });
  }

  async conciliar(pago: Pago, estado: 'CONCILIADO' | 'DISCREPANCIA'): Promise<void> {
    const accionTexto = estado === 'CONCILIADO' ? 'conciliar' : 'marcar discrepancia en';
    const confirmado = await this.alertModal.confirm(
      `Desea ${accionTexto} el pago #${pago.id || ''} por monto $${pago.monto}?`,
      'Confirmar Conciliacion',
      'Confirmar',
      'Cancelar'
    );
    if (!confirmado) return;

    const conc: Conciliacion = {
      pago: pago,
      montoExtractoBancario: pago.monto,
      montoRegistrado: pago.monto,
      estado: estado,
      conciliadoPorUser: 'Admin Finance'
    };
    this.finanzasService.conciliarPago(conc).subscribe({
      next: () => {
        this.cargarDatos();
        this.alertModal.success(`Pago marcado como ${estado} correctamente.`, 'Conciliacion Exitosa');
      },
      error: (err) => {
        console.error('Error conciliando pago:', err);
        this.alertModal.error('No se pudo completar la conciliacion bancaria.', 'Error');
      }
    });
  }
}
