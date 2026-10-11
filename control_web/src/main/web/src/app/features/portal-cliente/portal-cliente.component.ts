import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { FinanzasService, Pago } from '../../core/services/finanzas.service';
import { SignosVitalesService, SignosVitales } from '../../core/services/signos-vitales.service';

@Component({
  selector: 'app-portal-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portal-cliente.component.html',
  styleUrls: ['./portal-cliente.component.css']
})
export class PortalClienteComponent implements OnInit {
  clienteId: number = 1; // ID de sesión del cliente
  clienteData: any;
  suscripcionActiva: any;
  misPagos: Pago[] = [];
  notificaciones: any[] = [];
  misSignos?: SignosVitales;

  nuevoPagoCliente = {
    monto: 50.0,
    metodoPago: 'TRANSFERENCIA',
    numeroReferencia: ''
  };

  constructor(
    private http: HttpClient,
    private finanzasService: FinanzasService,
    private signosService: SignosVitalesService
  ) {}

  ngOnInit(): void {
    this.cargarDatosPortal();
  }

  cargarDatosPortal(): void {
    this.http.get(`/api/v1/clientes/${this.clienteId}`).subscribe(c => this.clienteData = c);
    this.http.get(`/api/v1/membresias/suscripciones/cliente/${this.clienteId}`).subscribe(s => this.suscripcionActiva = s);
    this.finanzasService.getPagosPorCliente(this.clienteId).subscribe(p => this.misPagos = p);
    this.http.get<any[]>(`/api/v1/notificaciones/cliente/${this.clienteId}`).subscribe(n => this.notificaciones = n);
    this.signosService.getUltimoCliente(this.clienteId).subscribe(sv => this.misSignos = sv);
  }

  realizarPagoWeb(): void {
    const pago: Pago = {
      cliente: { id: this.clienteId },
      monto: this.nuevoPagoCliente.monto,
      metodoPago: this.nuevoPagoCliente.metodoPago as any,
      origenPago: 'WEB_CLIENTE',
      registradoPor: 'Cliente Web',
      numeroReferencia: this.nuevoPagoCliente.numeroReferencia,
      estadoPago: 'PENDIENTE_CONCILIACION'
    };

    this.finanzasService.registrarPago(pago).subscribe(() => {
      alert('Pago o comprobante registrado con éxito. Pendiente de verificación por caja.');
      this.cargarDatosPortal();
    });
  }
}
