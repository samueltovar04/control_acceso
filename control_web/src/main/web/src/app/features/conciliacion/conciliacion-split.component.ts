import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MultiCurrencyFormatPipe } from '../../shared/pipes/multi-currency-format.pipe';
import { TasaCambioService } from '../../core/services/tasa-cambio.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { AlertModalService } from '../../shared/services/alert-modal.service';

export interface PagoPendiente {
  id: number;
  cliente: { id: number; nombre: string; apellido: string; documento: string };
  fechaPago: string;
  monto: number;
  monedaDeclarada: 'USD' | 'EUR' | 'VES';
  tasaBcvAplicada: number;
  montoEquivalenteVes: number;
  metodoPago: string;
  numeroReferencia: string;
  comprobanteUrl?: string;
  estadoPago: string;
}

@Component({
  selector: 'app-conciliacion-split',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule, MultiCurrencyFormatPipe],
  templateUrl: './conciliacion-split.component.html',
  styleUrls: ['./conciliacion-split.component.scss']
})
export class ConciliacionSplitComponent implements OnInit {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private wsService = inject(WebSocketService);
  private alertModal = inject(AlertModalService);
  tasaService = inject(TasaCambioService);

  pagos = signal<PagoPendiente[]>([]);
  pagoSeleccionado = signal<PagoPendiente | null>(null);
  cargando = signal<boolean>(false);

  zoomLevel = 1.0;
  rotation = 0;
  panX = 0;
  panY = 0;
  isDragging = false;
  startX = 0;
  startY = 0;

  motivoRechazo = '';
  mostrarModalRechazo = false;

  ngOnInit(): void {
    this.cargarPendientes();
    this.suscribirWebSockets();
  }

  cargarPendientes(): void {
    this.cargando.set(true);
    this.http.get<PagoPendiente[]>('/api/v1/finanzas/conciliacion/pendientes').subscribe({
      next: (data) => {
        this.pagos.set(data);
        if (data.length > 0 && !this.pagoSeleccionado()) {
          this.seleccionarPago(data[0]);
        }
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  seleccionarPago(pago: PagoPendiente): void {
    this.pagoSeleccionado.set(pago);
    this.resetVisor();
  }

  zoomIn(): void {
    if (this.zoomLevel < 3.5) this.zoomLevel += 0.25;
  }

  zoomOut(): void {
    if (this.zoomLevel > 0.5) this.zoomLevel -= 0.25;
  }

  rotate(): void {
    this.rotation = (this.rotation + 90) % 360;
  }

  resetVisor(): void {
    this.zoomLevel = 1.0;
    this.rotation = 0;
    this.panX = 0;
    this.panY = 0;
  }

  onMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.isDragging = true;
    this.startX = event.clientX - this.panX;
    this.startY = event.clientY - this.panY;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    this.panX = event.clientX - this.startX;
    this.panY = event.clientY - this.startY;
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.isDragging = false;
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    if (event.deltaY < 0) {
      this.zoomIn();
    } else {
      this.zoomOut();
    }
  }

  async aprobarPago(): Promise<void> {
    const pago = this.pagoSeleccionado();
    if (!pago) return;

    const confirmado = await this.alertModal.confirm(
      `Confirma conciliar el pago ref: ${pago.numeroReferencia} por ${pago.monto} ${pago.monedaDeclarada}?`,
      'Confirmar Conciliacion',
      'Conciliar',
      'Cancelar'
    );
    if (!confirmado) return;

    this.http.put(`/api/admin/pagos/${pago.id}/conciliar`, { usuarioConciliaId: 1 }).subscribe({
      next: () => {
        this.snackBar.open('Pago conciliado exitosamente. Membresia activada.', 'OK', { duration: 3000 });
        this.removerPagoDeLista(pago.id);
      },
      error: () => this.snackBar.open('Error al conciliar el pago.', 'Cerrar', { duration: 4000 })
    });
  }

  abrirModalRechazo(): void {
    this.motivoRechazo = '';
    this.mostrarModalRechazo = true;
  }

  confirmarRechazo(): void {
    const pago = this.pagoSeleccionado();
    if (!pago || !this.motivoRechazo.trim()) {
      this.alertModal.warning('Debe especificar un motivo de rechazo.', 'Motivo Requerido');
      return;
    }

    this.http.put(`/api/admin/pagos/${pago.id}/rechazar`, { motivo: this.motivoRechazo }).subscribe({
      next: () => {
        this.snackBar.open('Pago rechazado. Acceso a torniquetes revocado.', 'Aviso', { duration: 3000 });
        this.mostrarModalRechazo = false;
        this.removerPagoDeLista(pago.id);
      },
      error: () => this.snackBar.open('Error al rechazar el pago.', 'Cerrar', { duration: 4000 })
    });
  }

  private removerPagoDeLista(id: number): void {
    const filtrados = this.pagos().filter(p => p.id !== id);
    this.pagos.set(filtrados);
    this.pagoSeleccionado.set(filtrados.length > 0 ? filtrados[0] : null);
  }

  private suscribirWebSockets(): void {
    this.wsService.getNotificacionesEvents().subscribe(msg => {
      if (msg.evento === 'NUEVO_PAGO_REPORTADO') {
        this.cargarPendientes();
      }
    });
  }
}
