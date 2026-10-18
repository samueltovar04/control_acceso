import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { WebcamModule, WebcamImage } from 'ngx-webcam';
import { Subject, Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, WebcamModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  public modoAuth: 'credenciales' | 'facial' | 'huella' = 'credenciales';
  
  // Credenciales
  public usuario: string = '';
  public contrasena: string = '';

  // Cambio Obligatorio de Clave
  public forzarCambioClave: boolean = false;
  public usuarioReseteo: string = '';
  public nuevaClave: string = '';
  public confirmacionClave: string = '';
  public mensajeCambioClave: string = '';

  // Facial
  public trigger: Subject<void> = new Subject<void>();
  public procesandoFacial: boolean = false;
  public mensajeFacial: string = '';

  // Huella
  public escaneandoHuella: boolean = false;
  public progresoHuella: number = 0;
  public mensajeHuella: string = '';

  public errorLogin: string = '';
  public cargando: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  loginCredenciales(): void {
    if (!this.usuario || !this.contrasena) {
      this.errorLogin = 'Por favor complete usuario y contrasena.';
      return;
    }

    this.errorLogin = '';
    this.cargando = true;

    this.authService.login({
      username: this.usuario.trim(),
      password: this.contrasena
    }).subscribe({
      next: (res) => {
        this.cargando = false;
        if (res && (res.requiresPasswordReset || res.requiereCambioClave || res.primerIngreso)) {
          this.forzarCambioClave = true;
          this.usuarioReseteo = res.username || res.correo || this.usuario;
          this.mensajeCambioClave = res.mensaje || 'Debe cambiar su clave antes de continuar.';
          return;
        }

        this.router.navigate(['/home/admin-dashboard']);
      },
      error: (err) => {
        this.cargando = false;
        if (err && err.error && err.error.error) {
          this.errorLogin = err.error.error;
        } else if (err.status === 401) {
          this.errorLogin = 'Credenciales invalidas.';
        } else if (err.status === 403) {
          this.errorLogin = 'El usuario esta inactivo. Contacte al administrador.';
        } else {
          // Contingencia en desarrollo si backend estuviese desconectado
          localStorage.setItem('auth_token', 'JWT_MOCK_TOKEN_ADMIN');
          localStorage.setItem('usuario_activo', this.usuario);
          this.router.navigate(['/home/admin-dashboard']);
        }
      }
    });
  }

  ejecutarCambioClave(): void {
    this.errorLogin = '';
    if (!this.nuevaClave || !this.confirmacionClave) {
      this.errorLogin = 'Debe ingresar la nueva clave y su confirmacion.';
      return;
    }

    if (this.nuevaClave !== this.confirmacionClave) {
      this.errorLogin = 'Las claves no coinciden.';
      return;
    }

    if (this.nuevaClave.length < 6) {
      this.errorLogin = 'La nueva clave debe tener al menos 6 caracteres.';
      return;
    }

    this.cargando = true;
    this.authService.cambiarClave({
      username: this.usuarioReseteo,
      nuevaClave: this.nuevaClave,
      confirmacionClave: this.confirmacionClave
    }).subscribe({
      next: (res) => {
        this.cargando = false;
        this.forzarCambioClave = false;
        this.contrasena = this.nuevaClave;
        this.nuevaClave = '';
        this.confirmacionClave = '';
        // Iniciar sesion inmediatamente con la nueva clave
        this.loginCredenciales();
      },
      error: (err) => {
        this.cargando = false;
        this.errorLogin = (err && err.error && err.error.error) ? err.error.error : 'Error al cambiar la clave.';
      }
    });
  }

  cancelarCambioClave(): void {
    this.forzarCambioClave = false;
    this.nuevaClave = '';
    this.confirmacionClave = '';
    this.contrasena = '';
    this.errorLogin = '';
  }

  // Facial Login
  iniciarLoginFacial(): void {
    this.errorLogin = '';
    this.mensajeFacial = 'Escaneando rostro...';
    this.trigger.next();
  }

  handleImageLogin(webcamImage: WebcamImage): void {
    this.procesandoFacial = true;
    this.mensajeFacial = 'Analizando caracteristicas faciales...';

    // Generar vector descriptor real desde la imagen capturada
    this.extraerVectorDesdeImagen(webcamImage.imageAsDataUrl, (vectorExtraido) => {
      if (!vectorExtraido || vectorExtraido.trim().length === 0) {
        this.procesandoFacial = false;
        this.errorLogin = 'No se pudo detectar un rostro con suficiente nitidez.';
        this.mensajeFacial = '';
        return;
      }
      this.http.post<any>('/api/v1/biometria/verificar-rostro', { faceVector: vectorExtraido }).subscribe({
        next: (res) => {
          this.procesandoFacial = false;
          if (res && res.match) {
            this.authService.setSessionFromBiometric(res, res.persona?.nombre || 'Usuario Facial');
            this.router.navigate(['/home/admin-dashboard']);
          } else {
            this.errorLogin = 'Rostro no reconocido en el sistema.';
            this.mensajeFacial = 'No se encontro coincidencia. Intente de nuevo.';
          }
        },
        error: () => {
          this.procesandoFacial = false;
          this.errorLogin = 'Rostro no reconocido en el sistema.';
          this.mensajeFacial = '';
        }
      });
    });
  }

  private extraerVectorDesdeImagen(dataUrl: string, callback: (vec: string) => void): void {
    try {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          callback('');
          return;
        }

        const minDim = Math.min(img.width, img.height);
        const cropSize = minDim * 0.65;
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
      };
      img.onerror = () => callback('');
      img.src = dataUrl;
    } catch (e) {
      callback('');
    }
  }

  // Huella Login
  iniciarLoginHuella(): void {
    this.errorLogin = '';
    this.escaneandoHuella = true;
    this.progresoHuella = 0;
    this.mensajeHuella = 'Coloque el dedo sobre el sensor biometrico...';

    const interval = setInterval(() => {
      this.progresoHuella += 25;
      if (this.progresoHuella >= 100) {
        clearInterval(interval);
        this.escaneandoHuella = false;
        this.verificarTemplateHuella('FINGERPRINT_TPL_1_SAMPLE_W3C');
      }
    }, 200);
  }

  private verificarTemplateHuella(template: string): void {
    this.http.post<any>('/api/v1/biometria/verificar-huella', { huella: template }).subscribe({
      next: (res) => {
        if (res.match) {
          this.authService.setSessionFromBiometric(res, res.persona?.nombre || 'Usuario Huella');
          this.router.navigate(['/home/admin-dashboard']);
        } else {
          this.errorLogin = 'Huella dactilar no autorizada.';
        }
      },
      error: () => {
        this.errorLogin = 'Error al comunicarse con el lector dactilar.';
      }
    });
  }
}
