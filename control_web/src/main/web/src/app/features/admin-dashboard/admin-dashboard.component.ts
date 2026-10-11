import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanzasService, Pago, Conciliacion, BalanceFinanciero } from '../../core/services/finanzas.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  balance?: BalanceFinanciero;
  pagos: Pago[] = [];
  deudores: any[] = [];
  pendientesConciliacion: Pago[] = [];

  // Formulario nuevo pago
  nuevoPago: Pago = {
    monto: 0,
    metodoPago: 'EFECTIVO',
    origenPago: 'WEB_ADMIN',
    registradoPor: 'Admin Cajero',
    estadoPago: 'COMPLETADO'
  };

  clienteIdSeleccionado?: number;

  constructor(private finanzasService: FinanzasService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.finanzasService.getBalance().subscribe(b => this.balance = b);
    this.finanzasService.getPagos().subscribe(p => this.pagos = p);
    this.finanzasService.getDeudores().subscribe(d => this.deudores = d);
    this.finanzasService.getPendientesConciliacion().subscribe(pc => this.pendientesConciliacion = pc);
  }

  registrarPago(): void {
    if (this.clienteIdSeleccionado) {
      this.nuevoPago.cliente = { id: this.clienteIdSeleccionado };
    }
    this.finanzasService.registrarPago(this.nuevoPago).subscribe(() => {
      alert('Pago registrado exitosamente');
      this.cargarDatos();
      this.nuevoPago.monto = 0;
      this.nuevoPago.numeroReferencia = '';
    });
  }

  conciliar(pago: Pago, estado: 'CONCILIADO' | 'DISCREPANCIA'): void {
    const conc: Conciliacion = {
      pago: pago,
      montoExtractoBancario: pago.monto,
      montoRegistrado: pago.monto,
      estado: estado,
      conciliadoPorUser: 'Admin Finance'
    };
    this.finanzasService.conciliarPago(conc).subscribe(() => {
      alert(`Pago procesado como ${estado}`);
      this.cargarDatos();
    });
  }
}
