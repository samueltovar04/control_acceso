import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TasaCambioService } from '../../core/services/tasa-cambio.service';
import { MultiCurrencyFormatPipe } from '../../shared/pipes/multi-currency-format.pipe';
import { BcvConvertPipe } from '../../shared/pipes/bcv-convert.pipe';
import { FinanzasService, Pago, Conciliacion } from '../../core/services/finanzas.service';
import { ClienteService } from '../../shared/cliente/cliente.service';
import { Cliente } from '../../shared/cliente/cliente.model';
import { AlertModalService } from '../../shared/services/alert-modal.service';

@Component({
  selector: 'app-pagos-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MultiCurrencyFormatPipe, BcvConvertPipe],
  templateUrl: './pagos-dashboard.component.html',
  styleUrls: ['./pagos-dashboard.component.scss']
})
export class PagosDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private finanzasService = inject(FinanzasService);
  private clienteService = inject(ClienteService);
  private alertModal = inject(AlertModalService);
  tasaService = inject(TasaCambioService);

  pestanaActiva: 'resumen' | 'registro' = 'resumen';

  metricas: any = {
    recaudadoMesUSD: 0,
    recaudadoMesVES: 0,
    tasaActiva: null,
    clientesAlDia: 0,
    clientesPendienteConciliar: 0,
    clientesMorosos: 0
  };

  transacciones: any[] = [];
  transaccionesFiltradas: any[] = [];
  cargando: boolean = false;
  cargandoReporte: boolean = false;

  filtroEstado: string = 'TODOS';
  filtroBusqueda: string = '';
  periodoSeleccionado: string = 'todos';
  fechaSeleccionada: string = '';

  // --- TOTALIZADORES FILTRADOS Y RESUMEN POR METODO ---
  totalRecaudadoFiltradoUSD: number = 0;
  totalRecaudadoFiltradoVES: number = 0;
  resumenPorMetodo: { metodo: string; cantidad: number; totalUSD: number; totalVES: number }[] = [];

  // --- FORMULARIO REGISTRAR COBRO ---
  clientesList: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  busquedaClienteTexto: string = '';
  clienteSeleccionado: Cliente | null = null;
  mostrarDropdownClientes: boolean = false;

  // --- COBROS / PAGOS PENDIENTES DEL CLIENTE ---
  pagosPendientesCliente: Pago[] = [];
  pagosSeleccionadosIds: Set<number> = new Set<number>();
  cargandoPagosPendientes: boolean = false;

  errorReferencia: string = '';
  errorFormulario: string = '';
  mensajeExito: string = '';

  nuevoPago: Pago = {
    monto: 0,
    metodoPago: 'PAGO_MOVIL' as any,
    origenPago: 'WEB_ADMIN',
    registradoPor: 'Admin Caja',
    estadoPago: 'COMPLETADO',
    numeroReferencia: '',
    comprobanteUrl: ''
  };

  // --- CUPONES Y PROMOCIONES ---
  cuponTexto: string = '';
  validandoCupon: boolean = false;
  cuponAplicado: any = null;
  mensajeCupon: string = '';
  esCuponValido: boolean = false;
  montoOriginalBase: number = 0;

  comprobantePreview: string | null = null;
  guardandoPago: boolean = false;

  // --- CONCILIACION BANCARIA DE TRANSFERENCIAS ---
  pendientesConciliacion: Pago[] = [];
  cargandoPendientes: boolean = false;

  ngOnInit(): void {
    this.cargarMetricas();
    this.cargarReporteFinanciero();
    this.cargarClientes();
    this.cargarPendientesConciliacion();
  }

  cargarMetricas(): void {
    this.cargando = true;
    this.http.get<any>('/api/admin/dashboard/metricas').subscribe({
      next: (data) => {
        this.metricas = data || {};
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  cargarReporteFinanciero(): void {
    this.cargandoReporte = true;
    this.http.get<any>(`/api/admin/reportes/financiero?periodo=${this.periodoSeleccionado}`).subscribe({
      next: (data) => {
        this.transacciones = data?.transacciones || [];
        this.aplicarFiltros();
        this.cargandoReporte = false;
      },
      error: () => {
        this.cargandoReporte = false;
      }
    });
  }

  onPeriodoChange(): void {
    if (this.periodoSeleccionado !== 'dia' && this.periodoSeleccionado !== 'todos') {
      this.fechaSeleccionada = '';
    }
    this.aplicarFiltros();
  }

  onFechaChange(): void {
    if (this.fechaSeleccionada) {
      this.periodoSeleccionado = 'dia';
    }
    this.aplicarFiltros();
  }

  limpiarFiltroFecha(): void {
    this.fechaSeleccionada = '';
    this.periodoSeleccionado = 'todos';
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let filtradas = [...this.transacciones];

    // 1. Filtro por Fecha o Periodo
    if (this.fechaSeleccionada) {
      filtradas = filtradas.filter(t => {
        if (!t.fecha) return false;
        const fechaStr = new Date(t.fecha).toISOString().slice(0, 10);
        return fechaStr === this.fechaSeleccionada;
      });
    } else if (this.periodoSeleccionado === 'dia') {
      const hoy = new Date().toISOString().slice(0, 10);
      filtradas = filtradas.filter(t => {
        if (!t.fecha) return false;
        return new Date(t.fecha).toISOString().slice(0, 10) === hoy;
      });
    } else if (this.periodoSeleccionado === 'semanal') {
      const ahora = new Date();
      const hace7Dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtradas = filtradas.filter(t => {
        if (!t.fecha) return false;
        const f = new Date(t.fecha);
        return f >= hace7Dias && f <= ahora;
      });
    } else if (this.periodoSeleccionado === 'mensual') {
      const ahora = new Date();
      const hace30Dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtradas = filtradas.filter(t => {
        if (!t.fecha) return false;
        const f = new Date(t.fecha);
        return f >= hace30Dias && f <= ahora;
      });
    }

    // 2. Filtro por Estado
    if (this.filtroEstado !== 'TODOS') {
      filtradas = filtradas.filter(t => t.estado === this.filtroEstado);
    }

    // 3. Filtro por Busqueda (texto libre)
    if (this.filtroBusqueda.trim()) {
      const q = this.filtroBusqueda.toLowerCase().trim();
      filtradas = filtradas.filter(t => 
        (t.cliente && t.cliente.toLowerCase().includes(q)) ||
        (t.cedula && t.cedula.toLowerCase().includes(q)) ||
        (t.referencia && t.referencia.toLowerCase().includes(q)) ||
        (t.metodo && t.metodo.toLowerCase().includes(q))
      );
    }

    this.transaccionesFiltradas = filtradas;
    this.calcularTotalesYResumen();
  }

  calcularTotalesYResumen(): void {
    let sumUSD = 0;
    let sumVES = 0;
    const metodosMap = new Map<string, { cantidad: number; totalUSD: number; totalVES: number }>();

    const tasaActual = this.tasaService.tasaUsdSignal() || 1;

    for (const t of this.transaccionesFiltradas) {
      const esEfectivoOConciliado = (t.estado === 'PAGADO' || t.estado === 'CONCILIADO' || t.estado === 'COMPLETADO');
      const mUSD = Number(t.montoUSD) || 0;
      let mVES = Number(t.montoVES) || 0;
      if (mVES <= 0 && mUSD > 0) {
        const tasaAplicada = (Number(t.tasa) > 1) ? Number(t.tasa) : tasaActual;
        mVES = Number((mUSD * tasaAplicada).toFixed(2));
      }

      if (esEfectivoOConciliado) {
        sumUSD += mUSD;
        sumVES += mVES;
      }

      const metodoKey = (t.metodo || 'OTRO').toUpperCase();
      if (!metodosMap.has(metodoKey)) {
        metodosMap.set(metodoKey, { cantidad: 0, totalUSD: 0, totalVES: 0 });
      }
      const item = metodosMap.get(metodoKey)!;
      item.cantidad += 1;
      item.totalUSD += mUSD;
      item.totalVES += mVES;
    }

    this.totalRecaudadoFiltradoUSD = Number(sumUSD.toFixed(2));
    this.totalRecaudadoFiltradoVES = Number(sumVES.toFixed(2));

    this.resumenPorMetodo = Array.from(metodosMap.entries()).map(([metodo, stats]) => ({
      metodo,
      cantidad: stats.cantidad,
      totalUSD: Number(stats.totalUSD.toFixed(2)),
      totalVES: Number(stats.totalVES.toFixed(2))
    }));
  }

  exportarExcel(): void {
    if (!this.transaccionesFiltradas || this.transaccionesFiltradas.length === 0) {
      return;
    }

    const fechaHoy = new Date().toLocaleString();
    const filtroPeriodoTexto = this.fechaSeleccionada 
      ? `Fecha: ${this.fechaSeleccionada}` 
      : `Periodo: ${this.periodoSeleccionado.toUpperCase()}`;
    const filtroEstadoTexto = `Estado: ${this.filtroEstado}`;

    let filasHtml = '';
    for (const t of this.transaccionesFiltradas) {
      const fechaFmt = t.fecha ? new Date(t.fecha).toLocaleString() : '---';
      const estadoColor = (t.estado === 'PAGADO' || t.estado === 'CONCILIADO' || t.estado === 'COMPLETADO') 
        ? '#198754' 
        : (t.estado === 'RECHAZADO' ? '#dc3545' : '#ffc107');

      filasHtml += `
        <tr>
          <td style="text-align: center; border: 1px solid #dee2e6;">#${t.pagoId || ''}</td>
          <td style="border: 1px solid #dee2e6; font-weight: bold;">${t.cliente || ''}</td>
          <td style="text-align: center; border: 1px solid #dee2e6;">${t.cedula || ''}</td>
          <td style="text-align: right; border: 1px solid #dee2e6; color: #198754; font-weight: bold;">$ ${(Number(t.montoUSD) || 0).toFixed(2)}</td>
          <td style="text-align: right; border: 1px solid #dee2e6;">Bs. ${(Number(t.montoVES) || 0).toFixed(2)}</td>
          <td style="text-align: right; border: 1px solid #dee2e6;">${t.tasa ? Number(t.tasa).toFixed(4) : '---'}</td>
          <td style="text-align: center; border: 1px solid #dee2e6;">${t.metodo || ''}</td>
          <td style="border: 1px solid #dee2e6;">${t.referencia || 'N/A'}</td>
          <td style="text-align: center; border: 1px solid #dee2e6; color: ${estadoColor}; font-weight: bold;">${t.estado || ''}</td>
          <td style="text-align: center; border: 1px solid #dee2e6;">${fechaFmt}</td>
        </tr>
      `;
    }

    let filasResumenMetodos = '';
    for (const r of this.resumenPorMetodo) {
      filasResumenMetodos += `
        <tr>
          <td style="border: 1px solid #dee2e6; font-weight: bold;">${r.metodo}</td>
          <td style="text-align: center; border: 1px solid #dee2e6;">${r.cantidad}</td>
          <td style="text-align: right; border: 1px solid #dee2e6; color: #198754; font-weight: bold;">$ ${r.totalUSD.toFixed(2)}</td>
          <td style="text-align: right; border: 1px solid #dee2e6;">Bs. ${r.totalVES.toFixed(2)}</td>
        </tr>
      `;
    }

    const htmlExcel = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Control de Pagos</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
          .titulo-reporte { font-size: 16pt; font-weight: bold; color: #0d6efd; text-align: left; }
          .subtitulo-reporte { font-size: 10pt; color: #6c757d; }
          .th-tabla { background-color: #212529; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #000; }
          .tfoot-totales { background-color: #e9ecef; font-weight: bold; border-top: 2px solid #000; }
          .seccion-header { background-color: #f8f9fa; font-weight: bold; font-size: 12pt; border-bottom: 2px solid #0d6efd; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="10" class="titulo-reporte">SISTEMA DE CONTROL DE ACCESO - REPORTE DE PAGOS Y RECAUDACION</td>
          </tr>
          <tr>
            <td colspan="10" class="subtitulo-reporte">Generado el: ${fechaHoy} | Filtro: ${filtroPeriodoTexto} | ${filtroEstadoTexto}</td>
          </tr>
          <tr><td colspan="10"></td></tr>
          <thead>
            <tr>
              <th class="th-tabla" style="width: 70px;">ID</th>
              <th class="th-tabla" style="width: 220px;">CLIENTE / SOCIO</th>
              <th class="th-tabla" style="width: 110px;">CEDULA</th>
              <th class="th-tabla" style="width: 120px;">MONTO (USD)</th>
              <th class="th-tabla" style="width: 140px;">MONTO (VES)</th>
              <th class="th-tabla" style="width: 100px;">TASA BCV</th>
              <th class="th-tabla" style="width: 130px;">METODO</th>
              <th class="th-tabla" style="width: 160px;">REFERENCIA</th>
              <th class="th-tabla" style="width: 130px;">ESTADO</th>
              <th class="th-tabla" style="width: 150px;">FECHA OPERACION</th>
            </tr>
          </thead>
          <tbody>
            ${filasHtml}
          </tbody>
          <tfoot>
            <tr class="tfoot-totales">
              <td colspan="3" style="text-align: right; border: 1px solid #dee2e6; font-size: 12pt;">TOTAL GENERAL RECAUDADO (CONCILIADO/PAGADO):</td>
              <td style="text-align: right; border: 1px solid #dee2e6; color: #198754; font-size: 12pt;">$ ${this.totalRecaudadoFiltradoUSD.toFixed(2)}</td>
              <td style="text-align: right; border: 1px solid #dee2e6; font-size: 12pt;">Bs. ${this.totalRecaudadoFiltradoVES.toFixed(2)}</td>
              <td colspan="5" style="border: 1px solid #dee2e6;"></td>
            </tr>
          </tfoot>
        </table>

        <br/><br/>

        <!-- TABLA SECUNDARIA: RESUMEN POR METODOS DE PAGO -->
        <table style="width: 500px;">
          <tr>
            <td colspan="4" class="seccion-header">RESUMEN DE RECAUDACION POR METODO DE PAGO</td>
          </tr>
          <thead>
            <tr>
              <th class="th-tabla" style="width: 180px;">METODO DE PAGO</th>
              <th class="th-tabla" style="width: 100px;">OPERACIONES</th>
              <th class="th-tabla" style="width: 120px;">TOTAL (USD)</th>
              <th class="th-tabla" style="width: 140px;">TOTAL (VES)</th>
            </tr>
          </thead>
          <tbody>
            ${filasResumenMetodos}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlExcel], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    a.download = `Reporte_Pagos_${this.periodoSeleccionado}_${timestamp}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // --- LOGICA DE CLIENTES Y REGISTRO ---
  cargarClientes(): void {
    this.clienteService.getClientesList().subscribe({
      next: (data) => {
        this.clientesList = data || [];
        this.clientesFiltrados = [...this.clientesList];
      },
      error: () => {}
    });
  }

  filtrarClientes(): void {
    const q = this.busquedaClienteTexto.toLowerCase().trim();
    if (!q) {
      this.clientesFiltrados = [...this.clientesList];
      return;
    }
    this.clientesFiltrados = this.clientesList.filter(c => 
      (c.nombre && c.nombre.toLowerCase().includes(q)) ||
      (c.apellido && c.apellido.toLowerCase().includes(q)) ||
      (c.documento && c.documento.toLowerCase().includes(q))
    );
  }

  seleccionarCliente(c: Cliente): void {
    this.clienteSeleccionado = c;
    this.busquedaClienteTexto = `${c.nombre} ${c.apellido} (${c.documento})`;
    this.mostrarDropdownClientes = false;
    this.removerCupon();
    this.pagosSeleccionadosIds.clear();
    this.pagosPendientesCliente = [];

    if (c.id) {
      this.cargarPagosPendientesCliente(c.id);
    }
  }

  cargarPagosPendientesCliente(clienteId: number): void {
    this.cargandoPagosPendientes = true;
    this.http.get<Pago[]>(`/api/v1/finanzas/pagos/cliente/${clienteId}/pendientes`).subscribe({
      next: (pendientes) => {
        this.pagosPendientesCliente = pendientes || [];
        this.cargandoPagosPendientes = false;

        if (this.pagosPendientesCliente.length > 0) {
          // Seleccionar por defecto el mas reciente o todos
          this.pagosSeleccionadosIds.add(this.pagosPendientesCliente[0].id!);
          this.calcularMontoPagosSeleccionados();
        } else {
          // Si no tiene pagos pendientes generados por el scheduler, usar costo de la membresia actual si existe
          if (this.clienteSeleccionado?.membresiaActual && this.clienteSeleccionado.membresiaActual.precio) {
            this.nuevoPago.monto = this.clienteSeleccionado.membresiaActual.precio;
            this.montoOriginalBase = this.clienteSeleccionado.membresiaActual.precio;
          } else {
            this.nuevoPago.monto = 0;
            this.montoOriginalBase = 0;
          }
        }
      },
      error: () => {
        this.cargandoPagosPendientes = false;
        if (this.clienteSeleccionado?.membresiaActual && this.clienteSeleccionado.membresiaActual.precio) {
          this.nuevoPago.monto = this.clienteSeleccionado.membresiaActual.precio;
          this.montoOriginalBase = this.clienteSeleccionado.membresiaActual.precio;
        }
      }
    });
  }

  togglePagoSeleccionado(pago: Pago): void {
    if (!pago.id) return;
    if (this.pagosSeleccionadosIds.has(pago.id)) {
      this.pagosSeleccionadosIds.delete(pago.id);
    } else {
      this.pagosSeleccionadosIds.add(pago.id);
    }
    this.removerCupon();
    this.calcularMontoPagosSeleccionados();
  }

  toggleTodosLosPagos(): void {
    if (this.pagosSeleccionadosIds.size === this.pagosPendientesCliente.length) {
      this.pagosSeleccionadosIds.clear();
    } else {
      this.pagosPendientesCliente.forEach(p => {
        if (p.id) this.pagosSeleccionadosIds.add(p.id);
      });
    }
    this.removerCupon();
    this.calcularMontoPagosSeleccionados();
  }

  calcularMontoPagosSeleccionados(): void {
    let suma = 0;
    this.pagosPendientesCliente.forEach(p => {
      if (p.id && this.pagosSeleccionadosIds.has(p.id)) {
        suma += (Number(p.monto) || 0);
      }
    });
    this.montoOriginalBase = Number(suma.toFixed(2));
    this.nuevoPago.monto = this.montoOriginalBase;
  }

  limpiarClienteSeleccionado(): void {
    this.clienteSeleccionado = null;
    this.busquedaClienteTexto = '';
    this.clientesFiltrados = [...this.clientesList];
    this.pagosPendientesCliente = [];
    this.pagosSeleccionadosIds.clear();
    this.removerCupon();
    this.nuevoPago.monto = 0;
    this.montoOriginalBase = 0;
  }

  validarCupon(): void {
    const cod = this.cuponTexto.trim().toUpperCase();
    if (!cod) return;

    if (!this.nuevoPago.monto || this.nuevoPago.monto <= 0) {
      if (this.montoOriginalBase > 0) {
        this.nuevoPago.monto = this.montoOriginalBase;
      } else {
        this.alertModal.warning('Ingrese primero el monto base de la membresia antes de aplicar el cupon.', 'Monto Requerido');
        return;
      }
    }

    if (!this.montoOriginalBase || this.montoOriginalBase <= 0) {
      this.montoOriginalBase = this.nuevoPago.monto;
    }

    this.validandoCupon = true;
    this.mensajeCupon = '';
    this.esCuponValido = false;

    const payload = {
      codigo: cod,
      precioOriginal: this.montoOriginalBase,
      membresiaId: this.clienteSeleccionado?.membresiaActual?.id || null
    };

    this.http.post<any>('/api/v1/membresias/promociones/validar-cupon', payload).subscribe({
      next: (res) => {
        this.validandoCupon = false;
        if (res && res.valido) {
          this.esCuponValido = true;
          this.cuponAplicado = res;
          this.mensajeCupon = res.mensaje || 'Cupon aplicado exitosamente.';
          this.nuevoPago.monto = res.montoFinal;
        } else {
          this.esCuponValido = false;
          this.cuponAplicado = null;
          this.mensajeCupon = res.mensaje || 'Cupon no valido.';
          if (this.montoOriginalBase > 0) {
            this.nuevoPago.monto = this.montoOriginalBase;
          }
        }
      },
      error: () => {
        this.validandoCupon = false;
        this.esCuponValido = false;
        this.cuponAplicado = null;
        this.mensajeCupon = 'Error al validar el cupon.';
      }
    });
  }

  removerCupon(): void {
    this.cuponTexto = '';
    this.cuponAplicado = null;
    this.mensajeCupon = '';
    this.esCuponValido = false;
    if (this.montoOriginalBase > 0) {
      this.nuevoPago.monto = this.montoOriginalBase;
    }
  }


  onArchivoComprobante(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.comprobantePreview = e.target.result;
        this.nuevoPago.comprobanteUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removerComprobante(): void {
    this.comprobantePreview = null;
    this.nuevoPago.comprobanteUrl = '';
  }

  registrarPago(): void {
    this.errorReferencia = '';
    this.errorFormulario = '';

    if (!this.clienteSeleccionado || !this.clienteSeleccionado.id) {
      this.errorFormulario = 'Debe buscar y seleccionar un cliente de la lista.';
      return;
    }

    if (!this.nuevoPago.monto || this.nuevoPago.monto <= 0) {
      this.errorFormulario = 'Debe seleccionar al menos un pago pendiente o una membresia activa.';
      return;
    }

    if (!this.nuevoPago.numeroReferencia || !this.nuevoPago.numeroReferencia.trim()) {
      this.errorReferencia = 'El número de referencia es obligatorio.';
      return;
    }

    this.guardandoPago = true;
    this.nuevoPago.cliente = { id: this.clienteSeleccionado.id };
    if (this.cuponAplicado) {
      this.nuevoPago.registradoPor = `Admin Caja | Cupon: ${this.cuponAplicado.codigo} (-$${this.cuponAplicado.descuentoMonto})`;
    } else {
      this.nuevoPago.registradoPor = 'Admin Caja';
    }

    this.finanzasService.registrarPago(this.nuevoPago).subscribe({
      next: () => {
        // Si habia pagos pendientes generados previamente por el cron, actualizarlos a COMPLETADO
        if (this.pagosSeleccionadosIds.size > 0) {
          this.pagosSeleccionadosIds.forEach(pId => {
            this.http.patch(`/api/v1/finanzas/conciliacion`, {
              pago: { id: pId },
              estado: 'CONCILIADO',
              conciliadoPorUser: 'Admin Caja'
            }).subscribe({ error: () => {} });
          });
        }

        this.mensajeExito = 'Cobro / Pago registrado exitosamente.';
        this.guardandoPago = false;
        this.nuevoPago.monto = 0;
        this.nuevoPago.numeroReferencia = '';
        this.errorReferencia = '';
        this.errorFormulario = '';
        this.removerComprobante();
        this.limpiarClienteSeleccionado();
        this.cargarMetricas();
        this.cargarReporteFinanciero();
        this.cargarPendientesConciliacion();
      },
      error: () => {
        this.errorFormulario = 'Error al registrar el cobro del cliente.';
        this.guardandoPago = false;
      }
    });
  }

  // --- LOGICA DE PENDIENTES CONCILIACION ---
  cargarPendientesConciliacion(): void {
    this.cargandoPendientes = true;
    this.finanzasService.getPendientesConciliacion().subscribe({
      next: (data) => {
        this.pendientesConciliacion = data || [];
        this.cargandoPendientes = false;
      },
      error: () => {
        this.cargandoPendientes = false;
      }
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
    this.finanzasService.conciliarPago(conc).subscribe({
      next: () => {
        this.alertModal.success(`Pago procesado como ${estado}`, 'Conciliacion Actualizada');
        this.cargarPendientesConciliacion();
        this.cargarMetricas();
        this.cargarReporteFinanciero();
      },
      error: () => {
        this.alertModal.error('Error al procesar la conciliacion.', 'Error de Conciliacion');
      }
    });
  }
}
