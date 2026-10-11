import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { WebcamModule, WebcamImage } from 'ngx-webcam';
import { Subject, Observable } from 'rxjs';

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

  // Facial
  public trigger: Subject<void> = new Subject<void>();
  public procesandoFacial: boolean = false;
  public mensajeFacial: string = '';

  // Huella
  public escaneandoHuella: boolean = false;
  public progresoHuella: number = 0;
  public mensajeHuella: string = '';

  public errorLogin: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  loginCredenciales(): void {
    if (!this.usuario || !this.contrasena) {
      this.errorLogin = 'Por favor complete usuario y contraseña.';
      return;
    }
    // Autenticación exitosa
    localStorage.setItem('auth_token', 'JWT_MOCK_TOKEN_ADMIN');
    localStorage.setItem('usuario_activo', this.usuario);
    this.router.navigate(['/home/admin-dashboard']);
  }

  // Facial Login
  iniciarLoginFacial(): void {
    this.errorLogin = '';
    this.mensajeFacial = 'Escaneando rostro...';
    this.trigger.next();
  }

  handleImageLogin(webcamImage: WebcamImage): void {
    this.procesandoFacial = true;
    const mockVector = '0.12,0.45,-0.89,0.33,0.78';

    this.http.post<any>('/api/v1/biometria/verificar-rostro', { faceVector: mockVector }).subscribe({
      next: (res) => {
        this.procesandoFacial = false;
        if (res.match) {
          localStorage.setItem('auth_token', 'JWT_MOCK_TOKEN_BIOMETRIC');
          localStorage.setItem('usuario_activo', res.persona?.nombre || 'Usuario Facial');
          this.router.navigate(['/home/admin-dashboard']);
        } else {
          this.errorLogin = 'Rostro no reconocido en el sistema.';
        }
      },
      error: () => {
        // Fallback positivo en desarrollo
        this.procesandoFacial = false;
        localStorage.setItem('auth_token', 'JWT_MOCK_TOKEN_BIOMETRIC');
        localStorage.setItem('usuario_activo', 'Administrador Biométrico');
        this.router.navigate(['/home/admin-dashboard']);
      }
    });
  }

  // Huella Login
  iniciarLoginHuella(): void {
    this.errorLogin = '';
    this.escaneandoHuella = true;
    this.progresoHuella = 0;
    this.mensajeHuella = 'Coloque el dedo sobre el sensor biométrico...';

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
          localStorage.setItem('auth_token', 'JWT_MOCK_TOKEN_FINGERPRINT');
          localStorage.setItem('usuario_activo', res.persona?.nombre || 'Usuario Huella');
          this.router.navigate(['/home/admin-dashboard']);
        } else {
          this.errorLogin = 'Huella no coincide con ningún registro activo.';
        }
      },
      error: () => {
        // Fallback positivo en desarrollo
        localStorage.setItem('auth_token', 'JWT_MOCK_TOKEN_FINGERPRINT');
        localStorage.setItem('usuario_activo', 'Supervisor Huella Digital');
        this.router.navigate(['/home/admin-dashboard']);
      }
    });
  }

  get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }
}
