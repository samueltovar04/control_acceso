import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface DolarApiResponse {
  moneda: 'USD' | 'EUR';
  fuente: string;
  nombre: string;
  promedio: number;
  fechaActualizacion: string;
}

export interface BackendTasaResponse {
  moneda: string;
  tasa: number;
  fecha: string;
  vigente: boolean;
}

export interface TasaRegistroPayload {
  moneda: 'USD' | 'EUR';
  tasa: number;
  fuente: string;
  fecha: string;
}

export type SyncState = 'SINCRONIZADO' | 'DESACTUALIZADO' | 'SINCRONIZANDO' | 'ERROR';

@Injectable({
  providedIn: 'root'
})
export class TasaCambioService {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);

  private readonly URL_DOLAR_OFICIAL = 'https://ve.dolarapi.com/v1/dolares/oficial';
  private readonly URL_EURO_OFICIAL = 'https://ve.dolarapi.com/v1/euros/oficial';
  private readonly BACKEND_TASA_ACTUAL = '/api/tasas/actual';
  private readonly BACKEND_TASA_REGISTRAR = '/api/tasas/registrar';

  readonly tasaUsdSignal = signal<number | null>(null);
  readonly tasaEurSignal = signal<number | null>(null);
  readonly fechaVigenciaSignal = signal<string | null>(null);
  readonly estadoSincronizacionSignal = signal<SyncState>('DESACTUALIZADO');
  readonly cargandoSignal = signal<boolean>(false);

  readonly esTasaVigenteHoy = computed(() => {
    const fecha = this.fechaVigenciaSignal();
    if (!fecha) return false;
    const hoy = new Date().toISOString().substring(0, 10);
    return fecha.startsWith(hoy);
  });

  constructor() {
    this.cargarTasasInicialesBackend();
  }

  cargarTasasInicialesBackend(): void {
    forkJoin({
      usd: this.obtenerTasaBackend('USD'),
      eur: this.obtenerTasaBackend('EUR')
    }).subscribe({
      next: ({ usd, eur }) => {
        if (usd?.tasa) this.tasaUsdSignal.set(usd.tasa);
        if (eur?.tasa) this.tasaEurSignal.set(eur.tasa);
        if (usd?.fecha) {
          this.fechaVigenciaSignal.set(usd.fecha);
          const hoy = new Date().toISOString().substring(0, 10);
          this.estadoSincronizacionSignal.set(usd.fecha.startsWith(hoy) ? 'SINCRONIZADO' : 'DESACTUALIZADO');
        }
      },
      error: () => this.estadoSincronizacionSignal.set('ERROR')
    });
  }

  obtenerTasaBackend(moneda: 'USD' | 'EUR'): Observable<BackendTasaResponse | null> {
    return this.http.get<BackendTasaResponse>(`${this.BACKEND_TASA_ACTUAL}?moneda=${moneda}`).pipe(
      catchError(() => of(null))
    );
  }

  sincronizarMoneda(moneda: 'USD' | 'EUR'): Observable<boolean> {
    this.cargandoSignal.set(true);
    this.estadoSincronizacionSignal.set('SINCRONIZANDO');

    const urlExterna = moneda === 'USD' ? this.URL_DOLAR_OFICIAL : this.URL_EURO_OFICIAL;

    return forkJoin({
      externa: this.http.get<DolarApiResponse>(urlExterna),
      backend: this.obtenerTasaBackend(moneda)
    }).pipe(
      map(({ externa, backend }) => {
        const tasaExterna = Number(externa.promedio);
        const tasaBd = backend?.tasa ? Number(backend.tasa) : 0;

        if (!backend || tasaExterna > tasaBd) {
          const payload: TasaRegistroPayload = {
            moneda,
            tasa: tasaExterna,
            fuente: 'DolarAPI - BCV',
            fecha: externa.fechaActualizacion || new Date().toISOString()
          };

          this.http.post(this.BACKEND_TASA_REGISTRAR, payload).subscribe({
            next: () => {
              if (moneda === 'USD') this.tasaUsdSignal.set(tasaExterna);
              if (moneda === 'EUR') this.tasaEurSignal.set(tasaExterna);
              this.fechaVigenciaSignal.set(payload.fecha);
              this.estadoSincronizacionSignal.set('SINCRONIZADO');
              this.snackBar.open(`Tasa ${moneda} actualizada: Bs. ${tasaExterna}`, 'OK', { duration: 4000 });
            },
            error: () => {
              this.estadoSincronizacionSignal.set('ERROR');
              this.snackBar.open(`Error al persistir tasa ${moneda}`, 'Cerrar', { duration: 5000 });
            }
          });
          return true;
        } else {
          this.estadoSincronizacionSignal.set('SINCRONIZADO');
          this.snackBar.open(
            `La tasa actual (${tasaExterna} VES) no supera la registrada en base de datos (${tasaBd} VES). No se realizaron cambios.`,
            'Aviso',
            { duration: 5000 }
          );
          return false;
        }
      }),
      catchError(() => {
        this.estadoSincronizacionSignal.set('ERROR');
        this.snackBar.open('Error al conectar con el servicio de tasa oficial.', 'Cerrar', { duration: 5000 });
        return of(false);
      }),
      tap(() => this.cargandoSignal.set(false))
    );
  }

  obtenerHistoricoTasas(moneda?: string): Observable<any[]> {
    const url = moneda ? `/api/tasas/historico?moneda=${moneda}` : '/api/tasas/historico';
    return this.http.get<any[]>(url).pipe(
      catchError(() => of([]))
    );
  }

  registrarTasaManual(payload: { moneda: 'USD' | 'EUR'; tasa: number; fecha?: string; fuente?: string }): Observable<any> {
    const body: TasaRegistroPayload = {
      moneda: payload.moneda,
      tasa: Number(payload.tasa),
      fuente: payload.fuente || 'MANUAL',
      fecha: payload.fecha || new Date().toISOString()
    };

    return this.http.post(this.BACKEND_TASA_REGISTRAR, body).pipe(
      tap(() => {
        if (body.moneda === 'USD') this.tasaUsdSignal.set(body.tasa);
        if (body.moneda === 'EUR') this.tasaEurSignal.set(body.tasa);
        this.fechaVigenciaSignal.set(body.fecha);
        this.estadoSincronizacionSignal.set('SINCRONIZADO');
        this.snackBar.open(`Tasa ${body.moneda} manual registrada: Bs. ${body.tasa}`, 'OK', { duration: 4000 });
      }),
      catchError(err => {
        this.snackBar.open('Error al registrar tasa manual', 'Cerrar', { duration: 5000 });
        throw err;
      })
    );
  }

  sincronizarTodas(): void {
    forkJoin([this.sincronizarMoneda('USD'), this.sincronizarMoneda('EUR')]).subscribe();
  }
}
