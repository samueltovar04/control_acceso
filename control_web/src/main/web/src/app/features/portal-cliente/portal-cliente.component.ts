import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { FinanzasService, Pago } from '../../core/services/finanzas.service';
import { SignosVitalesService, SignosVitales } from '../../core/services/signos-vitales.service';
import { BancoService, Banco } from '../../core/services/banco.service';
import { AlertModalService } from '../../shared/services/alert-modal.service';
import { AuthService } from '../../core/services/auth.service';
import { WebSocketService } from '../../core/services/websocket.service';

@Component({
  selector: 'app-portal-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portal-cliente.component.html',
  styleUrls: ['./portal-cliente.component.css']
})
export class PortalClienteComponent implements OnInit, OnDestroy {
  clienteId: number = 1; // ID de sesión del cliente
  clienteData: any;
  suscripcionActiva: any;
  misPagos: Pago[] = [];
  notificaciones: any[] = [];
  misSignos: any = {
    ritmocardiacoBpm: 0,
    saturacionOxigenoSpo2: 0,
    temperaturaCorporal: 0.0,
    alertaSalud: false,
    timestamp: ''
  };
  bancosReceptores: Banco[] = [];
  bancoSeleccionado: Banco | null = null;
  private wsSubscription?: Subscription;

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
    private authService: AuthService,
    private wsService: WebSocketService
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
    this.escucharSignosEnVivo();
  }

  cargarDatosPortal(): void {
    if (!this.clienteId) return;
    this.http.get(`/api/v1/clientes/${this.clienteId}`).subscribe(c => {
      this.clienteData = c;
      this.consultarUltimaTelemetria();
    });
    this.http.get(`/api/v1/membresias/suscripciones/cliente/${this.clienteId}`).subscribe(s => this.suscripcionActiva = s);
    this.finanzasService.getPagosPorCliente(this.clienteId).subscribe(p => this.misPagos = p);
    this.http.get<any[]>(`/api/v1/notificaciones/cliente/${this.clienteId}`).subscribe(n => this.notificaciones = n);
    this.consultarUltimaTelemetria();
    this.cargarBancosReceptores();
  }

  consultarUltimaTelemetria(): void {
    this.signosService.getUltimoCliente(this.clienteId).subscribe({
      next: (sv: any) => {
        if (sv) {
          this.misSignos = {
            ritmocardiacoBpm: sv.bpm || sv.ritmocardiacoBpm || 0,
            saturacionOxigenoSpo2: sv.spo2 || sv.saturacionOxigenoSpo2 || 0,
            temperaturaCorporal: sv.temp || sv.temperatura || sv.temperaturaCorporal || 0.0,
            alertaSalud: (sv.estado_alerta === 1 || sv.alertaSalud === true),
            timestamp: sv.timestamp || ''
          };
        }
      },
      error: () => {}
    });
  }

  escucharSignosEnVivo(): void {
    this.wsSubscription = this.wsService.getSignosVitalesEvents().subscribe({
      next: (data: any) => {
        if (!data) return;
        const cid = data.cliente_id ? Number(data.cliente_id) : null;
        const mac = (data.id_pulsera || '').trim().toUpperCase();
        const clientMac = (this.clienteData?.codigoInsignia || '').trim().toUpperCase();

        const coincideCliente = (cid && cid === this.clienteId);
        const coincidePulsera = (mac && clientMac && mac === clientMac);

        if (coincideCliente || coincidePulsera || (!cid && !clientMac)) {
          this.misSignos = {
            ritmocardiacoBpm: data.bpm !== undefined ? data.bpm : this.misSignos.ritmocardiacoBpm,
            saturacionOxigenoSpo2: data.spo2 !== undefined ? data.spo2 : this.misSignos.saturacionOxigenoSpo2,
            temperaturaCorporal: data.temperatura !== undefined ? data.temperatura : (data.temp !== undefined ? data.temp : this.misSignos.temperaturaCorporal),
            alertaSalud: (data.alerta === true || data.estado_alerta === 1),
            timestamp: data.timestamp || new Date().toISOString()
          };
        }
      },
      error: (e) => console.error('Error WebSocket signos:', e)
    });
  }

  cargarBancosReceptores(): void {
    this.bancoService.getBancosActivos().subscribe({
      next: (data) => {
        this.bancosReceptores = data || [];
        if (this.bancosReceptores.length > 0) {
          if (!this.nuevoPagoCliente.bancoId) {
            this.nuevoPagoCliente.bancoId = this.bancosReceptores[0].id || null;
            this.bancoSeleccionado = this.bancosReceptores[0];
            if (this.bancosReceptores[0].tipo) {
              this.nuevoPagoCliente.metodoPago = this.bancosReceptores[0].tipo;
            }
          } else {
            this.onBancoSeleccionadoChange();
          }
        }
      },
      error: (err) => console.error('Error al cargar bancos receptores:', err)
    });
  }

  onMetodoPagoChange(): void {
    const metodo = this.nuevoPagoCliente.metodoPago;
    const bancoCoincidente = this.bancosReceptores.find(b => b.tipo === metodo);
    if (bancoCoincidente) {
      this.nuevoPagoCliente.bancoId = bancoCoincidente.id || null;
      this.bancoSeleccionado = bancoCoincidente;
    }
  }

  onBancoSeleccionadoChange(): void {
    if (this.nuevoPagoCliente.bancoId) {
      this.bancoSeleccionado = this.bancosReceptores.find(b => b.id === Number(this.nuevoPagoCliente.bancoId)) || null;
      if (this.bancoSeleccionado && this.bancoSeleccionado.tipo) {
        this.nuevoPagoCliente.metodoPago = this.bancoSeleccionado.tipo;
      }
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

  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
  }
}
