import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebcamImage, WebcamModule } from 'ngx-webcam';
import { Observable, Subject } from 'rxjs';

@Component({
  selector: 'app-biometric-capture',
  standalone: true,
  imports: [CommonModule, WebcamModule],
  templateUrl: './biometric-capture.component.html',
  styleUrls: ['./biometric-capture.component.css']
})
export class BiometricCaptureComponent {
  @Input() titulo: string = 'Captura de Datos Biometricos';
  @Input() fotoExistente: string = '';
  @Output() biometricDataChange = new EventEmitter<{
    fotoUrl?: string;
    faceVector?: string;
    huella1?: string;
    huella2?: string;
  }>();

  // Estado de Facial
  public webcamImage: WebcamImage | null = null;
  private trigger: Subject<void> = new Subject<void>();
  public faceVectorGenerado: string = '';
  public fotogramasCapturados: number = 0;

  // Estado de Dactilar
  public huella1Generada: string = '';
  public huella2Generada: string = '';
  public huellaActiva: 1 | 2 = 1;
  public escaneandoHuella: boolean = false;
  public calidadHuella: number = 0;

  get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  capturarFotograma(): void {
    this.trigger.next();
  }

  handleImage(webcamImage: WebcamImage): void {
    this.webcamImage = webcamImage;
    this.fotogramasCapturados++;

    // Generar embedding facial de 128 descriptores normalizados simulando Face-API
    const sampleDescriptors: number[] = [];
    for (let i = 0; i < 128; i++) {
      const val = (Math.sin(i * 0.35 + this.fotogramasCapturados) * 0.85).toFixed(4);
      sampleDescriptors.push(parseFloat(val));
    }
    this.faceVectorGenerado = sampleDescriptors.join(',');
    this.emitChanges();
  }

  iniciarEscaneoHuella(indice: 1 | 2): void {
    this.huellaActiva = indice;
    this.escaneandoHuella = true;
    this.calidadHuella = 0;

    const interval = setInterval(() => {
      this.calidadHuella += 20;
      if (this.calidadHuella >= 100) {
        clearInterval(interval);
        this.escaneandoHuella = false;
        const template = `FINGERPRINT_TPL_${indice}_${Math.random().toString(36).substring(2, 10).toUpperCase()}_W3C`;
        if (indice === 1) {
          this.huella1Generada = template;
        } else {
          this.huella2Generada = template;
        }
        this.emitChanges();
      }
    }, 150);
  }

  private emitChanges(): void {
    this.biometricDataChange.emit({
      fotoUrl: this.webcamImage ? this.webcamImage.imageAsDataUrl : undefined,
      faceVector: this.faceVectorGenerado,
      huella1: this.huella1Generada,
      huella2: this.huella2Generada
    });
  }
}
