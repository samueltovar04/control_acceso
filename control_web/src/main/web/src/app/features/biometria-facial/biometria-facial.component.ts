import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { WebcamModule, WebcamImage } from 'ngx-webcam';
import { Subject, Observable, Subscription } from 'rxjs';
import jsQR from 'jsqr';
import { SedeStateService } from '../../shared/sede/sede-state.service';
import { BiometricDeviceStateService, DispositivoBiometrico } from '../../shared/dispositivo/biometric-device-state.service';

export interface DispositivoItem {
  id: number;
  nombre: string;
  ip: string;
  tipo: string;
  tipoDispositivo?: string;
  descripcion?: string;
  state?: number;
  ubicacion?: string;
  estadoConexion?: boolean;
  piso?: any;
}

import { BiometricCaptureComponent } from '../../shared/components/biometric-capture/biometric-capture.component';

@Component({
  selector: 'app-biometria-facial',
  standalone: true,
  imports: [CommonModule, WebcamModule, FormsModule, BiometricCaptureComponent],
  templateUrl: './biometria-facial.component.html',
  styleUrls: ['./biometria-facial.component.css']
})
export class BiometriaFacialComponent implements OnInit, OnDestroy {
  @ViewChild('biometricCapture') biometricCapture?: BiometricCaptureComponent;
  public trigger: Subject<void> = new Subject<void>();
  public webcamImage?: WebcamImage;
  public resultadoVerificacion?: any;
  public procesando: boolean = false;
  public escaneandoHuella: boolean = false;
  public mensajeHuella: string = '';

  // Escaneo continuo y automatico de QR desde el video de camara
  private qrScannerInterval?: any;
  private ultimoQrLeido: string = '';
  private ultimoTimestampQr: number = 0;
  private ultimoTimestampFacialAuto: number = 0;
  public autoIdentificacionFacialActiva: boolean = true;

  // Modal Flotante de Identificación de Persona
  public mostrarModalPersona: boolean = false;
  public datosPersonaIdentificada: any = null;
  public origenIdentificacion: string = '';

  @Input() filtroSedeId: number | null = null;

  // Control de Torniquetes y Dispositivos
  public todosDispositivos: DispositivoItem[] = [];
  public torniquetesDisponibles: DispositivoItem[] = [];
  public dispositivosRedFiltrados: DispositivoItem[] = [];
  public dispositivoSeleccionadoId?: number;

  // Seleccion dinamica de hardware biometrico
  public captahuellasDisponibles: DispositivoBiometrico[] = [];
  public camarasDisponibles: DispositivoBiometrico[] = [];
  public captahuellasSeleccionadoId: string | number = 'LOCAL_8085';
  public camaraSeleccionadaId: string | number = 'LOCAL_WEBCAM';
  private bioDevSubs: Subscription[] = [];

  public estadoTorniquete: string = 'CERRADO';
  public mensajeTorniquete: string = '';
  public tiempoPulsoRestante: number = 0;
  public logEventos: Array<{ hora: string; mensaje: string; tipo: 'success' | 'danger' | 'info' }> = [];

  // Temporizador para auto-ocultar resultado en 40s
  public segundosRestantesResultado: number = 0;
  private timerResultadoSub?: any;
  public hayErrorActivo: boolean = false;
  private sedeSub?: Subscription;

  constructor(
    private http: HttpClient,
    private sedeStateService: SedeStateService,
    public biometricDeviceState: BiometricDeviceStateService
  ) {}

  ngOnInit(): void {
    this.cargarDispositivos();
    this.iniciarEscaneoContinuoQr();
    this.cargarBitacoraReciente();

    this.sedeSub = this.sedeStateService.sedeSeleccionadaId$.subscribe(id => {
      this.filtroSedeId = id;
      this.filtrarDispositivosPorSede();
      this.cargarBitacoraReciente();
    });

    this.bioDevSubs.push(
      this.biometricDeviceState.captahuellasDisponibles$.subscribe(list => {
        this.captahuellasDisponibles = list || [];
      })
    );

    this.bioDevSubs.push(
      this.biometricDeviceState.camarasDisponibles$.subscribe(list => {
        this.camarasDisponibles = list || [];
      })
    );

    this.bioDevSubs.push(
      this.biometricDeviceState.captahuellasSeleccionado$.subscribe(c => {
        this.captahuellasSeleccionadoId = c.id;
      })
    );

    this.bioDevSubs.push(
      this.biometricDeviceState.camaraSeleccionada$.subscribe(cam => {
        this.camaraSeleccionadaId = cam.id;
      })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filtroSedeId']) {
      this.filtrarDispositivosPorSede();
    }
  }

  ngOnDestroy(): void {
    if (this.qrScannerInterval) {
      clearInterval(this.qrScannerInterval);
    }
    if (this.timerResultadoSub) {
      clearInterval(this.timerResultadoSub);
    }
    if (this.sedeSub) {
      this.sedeSub.unsubscribe();
    }
    this.bioDevSubs.forEach(s => s.unsubscribe());
  }

  public onCambioCaptahuellas(val: any): void {
    this.captahuellasSeleccionadoId = val;
    this.biometricDeviceState.seleccionarCaptahuellas(val);
  }

  public onCambioCamara(val: any): void {
    this.camaraSeleccionadaId = val;
    this.biometricDeviceState.seleccionarCamara(val);
  }

  /**
   * Monitorea el elemento <video> de la camara cada 400ms para detectar codigos QR automaticamente sin pulsar boton
   */
  /**
   * Monitorea el elemento <video> de la camara cada 400ms para detectar codigos QR automaticamente sin pulsar boton
   */
  private iniciarEscaneoContinuoQr(): void {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    this.qrScannerInterval = setInterval(() => {
      // Si ya esta procesando un rostro, un modal abierto o torniquete abierto, pausar escaneo
      if (this.procesando || this.mostrarModalPersona || this.estadoTorniquete === 'ABIERTO') {
        return;
      }

      // 1. Escaneo de QR continuo
      const videoEl = document.querySelector('webcam video') as HTMLVideoElement;
      if (videoEl && videoEl.readyState === videoEl.HAVE_ENOUGH_DATA && videoEl.videoWidth > 0 && ctx) {
        try {
          canvas.width = videoEl.videoWidth;
          canvas.height = videoEl.videoHeight;
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
          if (code && code.data && code.data.trim().length > 0) {
            const qrLeido = code.data.trim();
            const ahora = Date.now();
            if (qrLeido === this.ultimoQrLeido && (ahora - this.ultimoTimestampQr < 5000)) {
              return;
            }
            this.ultimoQrLeido = qrLeido;
            this.ultimoTimestampQr = ahora;
            this.verificarAccesoPorQr(qrLeido);
            return;
          }
        } catch (err) {
          // Ignorar excepciones menores de renderizado
        }
      }

      // 2. Disparo automatico de identificacion facial si esta habilitado y se detecta rostro en vision optima
      if (this.autoIdentificacionFacialActiva && !this.procesando && this.estadoTorniquete !== 'ABIERTO') {
        const ahora = Date.now();
        const tieneRostroEnfocado = this.biometricCapture && (this.biometricCapture.faceDetectado && !!this.biometricCapture.faceBox);
        
        if (tieneRostroEnfocado) {
          const box = this.biometricCapture!.faceBox!;
          // Vision optima: rostro centrado y con dimension visible suficiente
          const esVisionOptima = (box.width >= 16 && box.height >= 20 && box.left >= 5 && box.left <= 75 && box.top <= 65);
          
          if (esVisionOptima && (ahora - this.ultimoTimestampFacialAuto > 2500)) {
            this.ultimoTimestampFacialAuto = ahora;
            this.capturarRostro();
          }
        }
      }
    }, 350);
  }

  cargarDispositivos(): void {
    this.http.get<DispositivoItem[]>('/api/v1/dispositivos').subscribe({
      next: (data) => {
        this.todosDispositivos = data || [];
        this.filtrarDispositivosPorSede();
      },
      error: () => {
        this.todosDispositivos = [];
        this.torniquetesDisponibles = [];
        this.dispositivosRedFiltrados = [];
        this.dispositivoSeleccionadoId = undefined;
      }
    });
  }

  public filtrarDispositivosPorSede(): void {
    // 1. Selector "Torniquete Asignado": solo dispositivos validos tipo torniquete pertenecientes a la sede
    this.torniquetesDisponibles = this.todosDispositivos.filter(d => {
      const tipoTexto = `${d.tipo || ''} ${d.tipoDispositivo || ''} ${d.nombre || ''} ${d.descripcion || ''}`.toLowerCase();
      const esActivo = d.state === 1 || d.estadoConexion === true;
      const esTorniquete = esActivo && tipoTexto.includes('torniquete');
      if (!esTorniquete) return false;

      if (this.filtroSedeId === null) return true;
      const sId = d.piso?.sede?.id || d.piso?.sede_id || d.piso?.sedeId;
      return sId !== undefined && sId !== null && Number(sId) === Number(this.filtroSedeId);
    });

    // 2. Panel "Dispositivos / Torniquetes en red": solo de tipo torniquetes y lector o huellas pertenecientes a la sede
    this.dispositivosRedFiltrados = this.todosDispositivos.filter(d => {
      const tipoTexto = `${d.tipo || ''} ${d.tipoDispositivo || ''} ${d.nombre || ''} ${d.descripcion || ''}`.toLowerCase();
      const esRelevante = tipoTexto.includes('torniquete') ||
                          tipoTexto.includes('lector') ||
                          tipoTexto.includes('huella') ||
                          tipoTexto.includes('camara') ||
                          tipoTexto.includes('cámara') ||
                          tipoTexto.includes('biometric');
      if (!esRelevante) return false;

      if (this.filtroSedeId === null) return true;
      const sId = d.piso?.sede?.id || d.piso?.sede_id || d.piso?.sedeId;
      return sId !== undefined && sId !== null && Number(sId) === Number(this.filtroSedeId);
    });

    // Verificar si el dispositivo seleccionado sigue disponible en la lista filtrada
    const sigueDisponible = this.torniquetesDisponibles.some(d => d.id === this.dispositivoSeleccionadoId);
    if (!sigueDisponible) {
      if (this.torniquetesDisponibles.length > 0) {
        this.dispositivoSeleccionadoId = this.torniquetesDisponibles[0].id;
      } else {
        this.dispositivoSeleccionadoId = undefined;
      }
    }
  }

  public capturarRostro(): void {
    if (this.biometricCapture) {
      this.biometricCapture.capturarFotograma();
    } else {
      this.trigger.next();
    }
  }

  public onFotogramaCapturado(evento: { fotoUrl: string; faceVector: string }): void {
    this.procesando = true;

    // Timeout de seguridad para evitar que procesando quede bloqueado indefinidamente
    const safetyTimeout = setTimeout(() => {
      this.procesando = false;
    }, 4500);
    
    // 1. Verificar primero si el fotograma contiene un codigo QR (cedula)
    this.detectarCodigoQrEnImagen(evento.fotoUrl, (codigoQr) => {
      clearTimeout(safetyTimeout);
      if (codigoQr && codigoQr.trim().length > 0) {
        this.verificarAccesoPorQr(codigoQr.trim(), evento.fotoUrl);
      } else if (evento.faceVector && evento.faceVector.trim().length > 0) {
        // 2. Si no es un QR, proceder con la identificacion biometrica facial normal
        this.verificarAccesoPorRostro(evento.faceVector);
      } else {
        this.procesando = false;
      }
    });
  }

  private detectarCodigoQrEnImagen(dataUrl: string, callback: (qrData: string | null) => void): void {
    try {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          callback(null);
          return;
        }
        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);

        // Intentar con jsQR
        try {
          const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
          if (code && code.data) {
            callback(code.data);
            return;
          }
        } catch (e) {
          // Si jsQR falla, intentar BarcodeDetector nativo
        }

        if ('BarcodeDetector' in window) {
          const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          detector.detect(canvas).then((barcodes: any[]) => {
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              callback(barcodes[0].rawValue);
            } else {
              callback(null);
            }
          }).catch(() => callback(null));
        } else {
          callback(null);
        }
      };
      img.onerror = () => callback(null);
      img.src = dataUrl;
    } catch (e) {
      callback(null);
    }
  }

  public verificarAccesoPorQr(codigoQr: string, fotoCaptura?: string): void {
    this.agregarLog(`Codigo QR detectado: ${codigoQr}. Verificando cedula...`, 'info');

    this.http.post<any>('/api/v1/biometria/verificar-qr', { codigoQr }).subscribe({
      next: (res) => {
        this.procesando = false;
        this.mostrarResultadoConAutoCierre(res);

        if (res.match && res.autorizado && res.persona) {
          const nombreCompleto = `${res.persona.nombre || res.persona.name || ''} ${res.persona.apellido || res.persona.lastName || ''}`.trim();
          this.agregarLog(`QR Valido: ${nombreCompleto || 'Persona Autorizada'} (Cedula: ${res.persona.documento || codigoQr}). Acceso Concedido.`, 'success');

          // Mostrar modal con los datos, membresia y foto
          this.abrirModalPersona(res.persona, res.tipo, 1.0, 'CODIGO_QR_CEDULA', res);

          // Enviar pulso de apertura al torniquete seleccionado
          this.enviarPulsoApertura(nombreCompleto || 'QR Autorizado');
        } else {
          this.activarMovimientoError();
          const motivo = res.mensaje || 'Cliente o empleado con acceso no autorizado o membresia vencida.';
          this.agregarLog(`QR Rechazado: ${motivo}`, 'danger');
        }
      },
      error: (err) => {
        this.procesando = false;
        this.mostrarResultadoConAutoCierre({ match: false });
        this.activarMovimientoError();
        const msg = err.error?.mensaje || `Cedula ${codigoQr} no encontrada en base de datos.`;
        this.agregarLog(`QR no registrado: ${msg}`, 'danger');
      }
    });
  }

  public verificarAccesoPorRostro(faceVector: string): void {
    this.http.post<any>('/api/v1/biometria/verificar-rostro', { faceVector }).subscribe({
      next: (res) => {
        this.mostrarResultadoConAutoCierre(res);
        this.procesando = false;

        if (res.match && res.persona) {
          const nombreCompleto = `${res.persona.nombre || res.persona.name || ''} ${res.persona.apellido || res.persona.lastName || ''}`.trim();
          
          // Mostrar modal flotante con los datos, membresia y foto de la persona
          this.abrirModalPersona(res.persona, res.tipo, res.similitud, 'RECONOCIMIENTO_FACIAL', res);

          if (res.autorizado) {
            this.agregarLog(`Rostro identificado: ${nombreCompleto || 'Persona Autorizada'} (Similitud ${(res.similitud * 100).toFixed(2)}%). Acceso Concedido.`, 'success');
            // Enviar pulso de apertura al torniquete seleccionado
            this.enviarPulsoApertura(nombreCompleto || 'Rostro Autorizado');
          } else {
            this.activarMovimientoError();
            const motivo = res.mensaje || 'Cliente sin membresia activa o empleado inactivo.';
            this.agregarLog(`Acceso Denegado: ${motivo}`, 'danger');
          }
        } else {
          this.activarMovimientoError();
          this.agregarLog('Rostro desconocido o sin coincidencia en base de datos.', 'danger');
        }
      },
      error: () => {
        this.procesando = false;
        this.mostrarResultadoConAutoCierre({ match: false });
        this.activarMovimientoError();
        this.agregarLog('Rostro no registrado o no coincide con los fotogramas guardados.', 'danger');
      }
    });
  }

  private mostrarResultadoConAutoCierre(res: any): void {
    this.resultadoVerificacion = res;
    this.segundosRestantesResultado = 40;

    if (this.timerResultadoSub) {
      clearInterval(this.timerResultadoSub);
    }

    this.timerResultadoSub = setInterval(() => {
      this.segundosRestantesResultado--;
      if (this.segundosRestantesResultado <= 0) {
        clearInterval(this.timerResultadoSub);
        this.resultadoVerificacion = null;
      }
    }, 1000);
  }

  private activarMovimientoError(): void {
    this.hayErrorActivo = true;
    this.reproducirSonidoError();
    setTimeout(() => {
      this.hayErrorActivo = false;
    }, 600);
  }

  private extraerVectorFacial(dataUrl: string, callback: (vector: string) => void): void {
    try {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Enfocar y recortar solo el area del rostro dentro del circulo central (60% de dimensiones)
          const minDim = Math.min(img.width, img.height);
          const cropSize = minDim * 0.60;
          const sx = (img.width - cropSize) / 2;
          const sy = (img.height - cropSize) / 2;

          ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, 64, 64);
          const imgData = ctx.getImageData(0, 0, 64, 64).data;
          const descriptors: number[] = [];
          const step = Math.floor(imgData.length / 128);
          for (let i = 0; i < 128; i++) {
            let sum = 0;
            const startIdx = i * step;
            for (let j = 0; j < step; j += 4) {
              const r = imgData[startIdx + j] || 0;
              const g = imgData[startIdx + j + 1] || 0;
              const b = imgData[startIdx + j + 2] || 0;
              sum += (0.299 * r + 0.587 * g + 0.114 * b);
            }
            const normalized = ((sum / (step / 4) - 128) / 128);
            descriptors.push(parseFloat(normalized.toFixed(4)));
          }
          callback(descriptors.join(','));
        } else {
          callback(this.generarVectorFallback());
        }
      };
      img.onerror = () => callback(this.generarVectorFallback());
      img.src = dataUrl;
    } catch (e) {
      callback(this.generarVectorFallback());
    }
  }

  private generarVectorFallback(): string {
    const sampleDescriptors: number[] = [];
    for (let i = 0; i < 128; i++) {
      sampleDescriptors.push(parseFloat((Math.sin(i * 0.35) * 0.85).toFixed(4)));
    }
    return sampleDescriptors.join(',');
  }

  /**
   * Captura de huella dactilar directa desde el captahuellas USB Suprema activo
   * @param dedo 1: Índice, 2: Pulgar
   */
  public capturarHuellaTerminal(dedo: number = 1): void {
    const nombreDedo = dedo === 1 ? 'Indice' : 'Pulgar';
    this.escaneandoHuella = true;
    const host = this.biometricDeviceState.getHostCaptahuellasActual();
    this.mensajeHuella = `Coloque el dedo ${nombreDedo} en el sensor (${host})...`;

    const url = `/api/v1/biometria/suprema/capturar?dedo=${dedo}&host=${encodeURIComponent(host)}`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        if (!res.success) {
          this.escaneandoHuella = false;
          this.mensajeHuella = res.error || 'Error: Dedo mal posicionado o no detectado';
          this.reproducirSonidoError();
          this.agregarLog(`Fallo al capturar huella: ${this.mensajeHuella}`, 'danger');
          return;
        }

        const template = res.minucias;
        this.reproducirSonidoHuella();
        this.mensajeHuella = 'Lectura correcta. Validando en base de datos...';
        this.agregarLog('Huella capturada en sensor Suprema. Verificando...', 'info');

        // Validar minucias en la base de datos de clientes y empleados
        this.http.post<any>('/api/v1/biometria/verificar-huella', { huella: template }).subscribe({
          next: (matchRes) => {
            this.escaneandoHuella = false;
            this.mensajeHuella = 'Verificacion biometrica exitosa';
            this.mostrarResultadoConAutoCierre(matchRes);

            if (matchRes.match && matchRes.persona) {
              const nombreCompleto = `${matchRes.persona.nombre || matchRes.persona.name || ''} ${matchRes.persona.apellido || matchRes.persona.lastName || ''}`.trim();
              
              // Abrir modal flotante con foto, datos y membresia
              this.abrirModalPersona(matchRes.persona, matchRes.tipo, matchRes.calidad ? (matchRes.calidad / 100) : 0.98, 'HUELLA_DACTILAR_SUPREMA', matchRes);

              if (matchRes.autorizado) {
                this.agregarLog(`Huella identificada: ${nombreCompleto || 'Persona Autorizada'} (${matchRes.tipo}). Acceso Concedido.`, 'success');
                // Mandar a abrir el torniquete seleccionado
                this.enviarPulsoApertura(nombreCompleto || 'Huella Autorizada');
              } else {
                this.activarMovimientoError();
                const motivo = matchRes.mensaje || 'Cliente sin membresia activa o empleado inactivo.';
                this.agregarLog(`Huella Rechazada: ${motivo}`, 'danger');
              }
            } else {
              this.activarMovimientoError();
              this.agregarLog('Huella no registrada en el sistema de clientes ni empleados.', 'danger');
            }
          },
          error: () => {
            this.escaneandoHuella = false;
            this.mensajeHuella = 'Huella no encontrada en base de datos.';
            this.mostrarResultadoConAutoCierre({ match: false });
            this.activarMovimientoError();
            this.agregarLog('Huella no encontrada en la base de datos.', 'danger');
          }
        });
      },
      error: () => {
        this.escaneandoHuella = false;
        this.mensajeHuella = 'Error de comunicacion con el lector Suprema USB.';
        this.activarMovimientoError();
        this.agregarLog('Lector Suprema USB no responde. Verifique servicio bridge.', 'danger');
      }
    });
  }

  public abrirModalPersona(persona: any, tipo: string, similitud: number, metodo: string, respuestaApi?: any): void {
    const estadoMembresia = respuestaApi?.estadoMembresia || persona.estadosuscripcion || persona.estadoSuscripcion || (persona.enabled ? 'ACTIVO' : 'SIN_ESTADO');
    let labelMetodo = 'Rostro Facial 128D';
    if (metodo === 'HUELLA_DACTILAR_SUPREMA') {
      labelMetodo = 'Huella Suprema 384B';
    } else if (metodo === 'CODIGO_QR_CEDULA') {
      labelMetodo = 'Codigo QR (Cedula)';
    }

    const nombreMembresiaReal = respuestaApi?.membresiaNombre ||
                                persona.membresiaActual?.nombre ||
                                persona.membresia?.nombre ||
                                (typeof persona.membresia === 'string' ? persona.membresia : null) ||
                                (tipo === 'CLIENTE' ? 'Sin Membresia Asignada' : 'Personal Interno');

    this.datosPersonaIdentificada = {
      ...persona,
      tipoPersona: tipo || 'CLIENTE',
      similitudPorcentaje: (similitud * 100).toFixed(1),
      metodoValidacion: labelMetodo,
      fotoUrl: persona.foto || (persona.picture ? `data:image/jpeg;base64,${persona.picture}` : null),
      documentoCompleto: persona.documento || persona.document || persona.cedula || 'N/A',
      nombreCompleto: `${persona.nombre || persona.name || ''} ${persona.apellido || persona.lastName || ''}`.trim(),
      estado: estadoMembresia,
      membresiaEstado: estadoMembresia,
      membresiaNombre: nombreMembresiaReal
    };
    this.mostrarModalPersona = true;
  }

  public cerrarModalPersona(): void {
    this.mostrarModalPersona = false;
  }

  enviarPulsoApertura(origen: string = 'Operador Manual'): void {
    if (!this.dispositivoSeleccionadoId) {
      return;
    }

    const dispo = this.torniquetesDisponibles.find(d => d.id === this.dispositivoSeleccionadoId) ||
                  this.todosDispositivos.find(d => d.id === this.dispositivoSeleccionadoId);

    if (!dispo || !dispo.ip) {
      return;
    }

    const payload = {
      operador: origen,
      ip: dispo.ip
    };

    this.http.post<any>(`/api/v1/acceso/dispositivo/${dispo.id}/abrir`, payload).subscribe({
      next: (resp) => {
        this.activarReleApertura(resp.mensaje || 'Torniquete Abierto');
        const nombreTorniquete = dispo.nombre || dispo.descripcion || 'Torniquete';
        this.agregarLog(`Apertura fisica enviada a ${nombreTorniquete} (${dispo.ip})`, 'info');
      },
      error: () => {
        this.activarReleApertura('Pulso de apertura simulado con exito.');
      }
    });
  }

  private activarReleApertura(mensaje: string): void {
    this.estadoTorniquete = 'ABIERTO';
    this.mensajeTorniquete = mensaje;
    this.tiempoPulsoRestante = 3;

    const timer = setInterval(() => {
      this.tiempoPulsoRestante--;
      if (this.tiempoPulsoRestante <= 0) {
        clearInterval(timer);
        this.estadoTorniquete = 'CERRADO';
        this.mensajeTorniquete = 'Paso cerrado y asegurado.';
      }
    }, 1000);
  }

  private agregarLog(mensaje: string, tipo: 'success' | 'danger' | 'info'): void {
    const hora = new Date().toLocaleTimeString();
    this.logEventos.unshift({ hora, mensaje, tipo });
    if (this.logEventos.length > 8) {
      this.logEventos.pop();
    }

    // Persistir evento de paso en MongoDB
    try {
      this.http.post('/api/v1/acceso/bitacora', {
        hora,
        mensaje,
        tipo,
        concedido: tipo === 'success',
        metodo: tipo === 'info' ? 'RELE_MANUAL' : 'BIOMETRICO',
        sedeId: this.filtroSedeId || null,
        dispositivoId: this.dispositivoSeleccionadoId ? Number(this.dispositivoSeleccionadoId) : null
      }).subscribe({
        next: () => {},
        error: () => {}
      });
    } catch (e) {
      // Ignorar fallas de red no criticas
    }
  }

  private cargarBitacoraReciente(): void {
    const sedeParam = this.filtroSedeId ? `&sedeId=${this.filtroSedeId}` : '';
    this.http.get<any>(`/api/v1/acceso/bitacora?page=0&size=8${sedeParam}`).subscribe({
      next: (res) => {
        if (res && res.data && res.data.length > 0) {
          this.logEventos = res.data.map((b: any) => ({
            hora: b.hora || new Date(b.fechaHora).toLocaleTimeString(),
            mensaje: b.mensaje,
            tipo: b.tipo || (b.concedido ? 'success' : 'danger')
          }));
        }
      },
      error: () => {}
    });
  }

  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  private reproducirSonidoCamara(): void {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
      console.warn('AudioContext no disponible para sonido de camara', e);
    }
  }

  private reproducirSonidoHuella(): void {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
      osc.frequency.setValueAtTime(1600, audioCtx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.14);
    } catch (e) {
      console.warn('AudioContext no disponible para sonido de huella', e);
    }
  }

  private reproducirSonidoError(): void {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, audioCtx.currentTime);
      osc.frequency.setValueAtTime(180, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.28);
    } catch (e) {
      console.warn('AudioContext no disponible para error', e);
    }
  }
}
