import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Sede, SedeService } from './sede.service';
import { AuthService, UserAuth } from '../../core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class SedeStateService {
  private readonly STORAGE_KEY = 'control_acceso_sede_seleccionada';

  private sedesSubject = new BehaviorSubject<Sede[]>([]);
  public sedes$ = this.sedesSubject.asObservable();

  private sedeSeleccionadaIdSubject = new BehaviorSubject<number | null>(null);
  public sedeSeleccionadaId$ = this.sedeSeleccionadaIdSubject.asObservable();

  private sedeBloqueadaSubject = new BehaviorSubject<boolean>(false);
  public sedeBloqueada$ = this.sedeBloqueadaSubject.asObservable();

  constructor(
    private sedeService: SedeService,
    private authService: AuthService
  ) {
    this.cargarSedes();
    this.inicializarEstadoSegunSesion();
  }

  public cargarSedes(): void {
    this.sedeService.getListSedes().subscribe({
      next: (sedes) => {
        this.sedesSubject.next(sedes || []);
        this.revalidarSedeSeleccionada();
      },
      error: (err) => console.error('Error al cargar sedes:', err)
    });
  }

  public inicializarEstadoSegunSesion(): void {
    this.authService.currentUser$.subscribe((user: UserAuth | null) => {
      this.aplicarReglasUsuario(user);
    });
  }

  private aplicarReglasUsuario(user: UserAuth | null): void {
    if (user) {
      const esAdmin = this.authService.isAdminOrSuperAdmin();

      if (esAdmin) {
        this.sedeBloqueadaSubject.next(false);
        const stored = this.getStoredSedeId();
        this.sedeSeleccionadaIdSubject.next(stored);
      } else {
        const userSedeId = user.sedeId || (user.sede && user.sede.id) ? Number(user.sedeId || user.sede.id) : null;
        if (userSedeId !== null) {
          this.sedeBloqueadaSubject.next(true);
          this.sedeSeleccionadaIdSubject.next(userSedeId);
          return;
        }
        this.sedeBloqueadaSubject.next(false);
        this.sedeSeleccionadaIdSubject.next(this.getStoredSedeId());
      }
    } else {
      this.sedeBloqueadaSubject.next(false);
      this.sedeSeleccionadaIdSubject.next(this.getStoredSedeId());
    }
  }

  private getStoredSedeId(): number | null {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw || raw === 'null' || raw === 'undefined') {
      return null;
    }
    const parsed = Number(raw);
    return isNaN(parsed) ? null : parsed;
  }

  private revalidarSedeSeleccionada(): void {
    const current = this.sedeSeleccionadaIdSubject.value;
    const sedes = this.sedesSubject.value;
    if (current !== null && sedes.length > 0) {
      const existe = sedes.some(s => s.id === current);
      if (!existe && !this.sedeBloqueadaSubject.value) {
        this.seleccionarSede(null);
      }
    }
  }

  public seleccionarSede(sedeId: number | null): void {
    if (this.sedeBloqueadaSubject.value) {
      return;
    }
    if (sedeId === null || isNaN(Number(sedeId))) {
      this.sedeSeleccionadaIdSubject.next(null);
      localStorage.removeItem(this.STORAGE_KEY);
    } else {
      const numId = Number(sedeId);
      this.sedeSeleccionadaIdSubject.next(numId);
      localStorage.setItem(this.STORAGE_KEY, String(numId));
    }
  }

  public getSedeActualId(): number | null {
    return this.sedeSeleccionadaIdSubject.value;
  }

  public getSedesList(): Sede[] {
    return this.sedesSubject.value;
  }

  public esSedeBloqueada(): boolean {
    return this.sedeBloqueadaSubject.value;
  }
}
