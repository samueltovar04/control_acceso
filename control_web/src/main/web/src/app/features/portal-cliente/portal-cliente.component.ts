import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { FinanzasService, Pago } from '../../core/services/finanzas.service';
import { SignosVitalesService, SignosVitales } from '../../core/services/signos-vitales.service';
import { BancoService, Banco } from '../../core/services/banco.service';
import { AlertModalService } from '../../shared/services/alert-modal.service';
import { AuthService } from '../../core/services/auth.service';

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
  bancosReceptores: Banco[] = [];
  bancoSeleccionado: Banco | null = null;

  nuevoPagoCliente = {
    monto: 50.0,
    montoOriginal: 50.0,
    metodoPago: 'PAGO_MOVIL',
    bancoId: null as number | null,
    numeroReferencia: '',
    codigoCupon: '',
    descuentoMonto: 0
  };
  validandoCupon = false;
  cuponInfo: any = null;

  constructor(
    private http: HttpClient,
    private finanzasService: FinanzasService,
    private signosService: SignosVitalesService,
    private bancoService: BancoService,
    private alertModal: AlertModalService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user && user.clienteId) {
      this.clienteId = user.clienteId;
    } else {
      const storedId = localStorage.getItem('cliente_id');
      if (storedId) {
        this.clienteId = Number(storedId);
      }
    }
    this.cargarDatosPortal();
  }

  cargarDatosPortal(): void {
    if (!this.clienteId) return;
    this.http.get(`/api/v1/clientes/${this.clienteId}`).subscribe(c => this.clienteData = c);
    this.http.get(`/api/v1/membresias/suscripciones/cliente/${this.clienteId}`).subscribe(s => this.suscripcionActiva = s);
    this.finanzasService.getPagosPorCliente(this.clienteId).subscribe(p => this.misPagos = p);
    this.http.get<any[]>(`/api/v1/notificaciones/cliente/${this.clienteId}`).subscribe(n => this.notificaciones = n);
    this.signosService.getUltimoCliente(this.clienteId).subscribe(sv => this.misSignos = sv);
    this.cargarBancosReceptores();
  }

  cargarBancosReceptores(): void {
    this.bancoService.getBancosActivos().subscribe({
      next: (data) => {
        this.bancosReceptores = data || [];
        this.actualizarBancoPorMetodo();
      },
      error: (err) => console.error('Error al cargar bancos receptores:', err)
    });
  }

  onMetodoPagoChange(): void {
    this.actualizarBancoPorMetodo();
  }

  actualizarBancoPorMetodo(): void {
    const metodo = this.nuevoPagoCliente.metodoPago;
    const bancosCoincidentes = this.bancosReceptores.filter(b => b.tipo === metodo);
    if (bancosCoincidentes.length > 0) {
      this.nuevoPagoCliente.bancoId = bancosCoincidentes[0].id || null;
      this.bancoSeleccionado = bancosCoincidentes[0];
    } else {
      this.nuevoPagoCliente.bancoId = null;
      this.bancoSeleccionado = null;
    }
  }

  onBancoSeleccionadoChange(): void {
    if (this.nuevoPagoCliente.bancoId) {
      this.bancoSeleccionado = this.bancosReceptores.find(b => b.id === Number(this.nuevoPagoCliente.bancoId)) || null;
    } else {
      this.bancoSeleccionado = null;
    }
  }

  copiarDato(texto?: string): void {
    if (!texto) return;
    navigator.clipboard.writeText(texto).then(() => {
      this.alertModal.info('Copiado al portapapeles: ' + texto, 'Portapapeles');
    });
  }

  validarCupon(): void {
    if (!this.nuevoPagoCliente.codigoCupon || !this.nuevoPagoCliente.codigoCupon.trim()) {
      this.alertModal.warning('Ingrese un codigo de cupon', 'Cupon Requerido');
      return;
    }
    this.validandoCupon = true;
    const membId = this.suscripcionActiva?.membresia?.id || this.clienteData?.membresiaActual?.id || null;
    const payload = {
      codigo: this.nuevoPagoCliente.codigoCupon.trim().toUpperCase(),
      membresiaId: membId,
      precioOriginal: this.nuevoPagoCliente.montoOriginal || this.nuevoPagoCliente.monto
    };

    this.http.post<any>('/api/v1/membresias/promociones/validar-cupon', payload).subscribe({
      next: (res) => {
        this.validandoCupon = false;
        if (res.valido) {
          this.cuponInfo = res;
          this.nuevoPagoCliente.monto = res.montoFinal;
          this.nuevoPagoCliente.descuentoMonto = res.descuentoMonto;
          this.alertModal.success(`Cupon aplicado: ${res.nombre}. Descuento: $${res.descuentoMonto}`, 'Cupon Aplicado');
        } else {
          this.cuponInfo = null;
          this.alertModal.error(res.mensaje || 'Cupon no valido', 'Cupon Invalido');
        }
      },
      error: () => {
        this.validandoCupon = false;
        this.alertModal.error('Error al validar el cupon', 'Error');
      }
    });
  }

  removerCupon(): void {
    this.cuponInfo = null;
    this.nuevoPagoCliente.codigoCupon = '';
    this.nuevoPagoCliente.monto = this.nuevoPagoCliente.montoOriginal || 50.0;
    this.nuevoPagoCliente.descuentoMonto = 0;
  }

  realizarPagoWeb(): void {
    let registrado = 'Cliente Web';
    if (this.cuponInfo) {
      registrado += ` | Cupon: ${this.cuponInfo.codigo} (-$${this.cuponInfo.descuentoMonto})`;
    }

    const pago: Pago = {
      cliente: { id: this.clienteId },
      monto: this.nuevoPagoCliente.monto,
      metodoPago: this.nuevoPagoCliente.metodoPago as any,
      origenPago: 'WEB_CLIENTE',
      registradoPor: registrado,
      numeroReferencia: this.nuevoPagoCliente.numeroReferencia,
      estadoPago: 'PENDIENTE_CONCILIACION'
    };

    this.finanzasService.registrarPago(pago).subscribe(() => {
      this.alertModal.success('Pago o comprobante registrado con exito. Pendiente de verificacion por caja.', 'Pago Enviado');
      this.removerCupon();
      this.cargarDatosPortal();
    });
  }
}
