import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';

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
        }
        if (usd?.tasa || eur?.tasa) {
          this.estadoSincronizacionSignal.set('SINCRONIZADO');
        } else {
          this.estadoSincronizacionSignal.set('DESACTUALIZADO');
        }
      },
      error: () => {
        if (this.tasaUsdSignal() || this.tasaEurSignal()) {
          this.estadoSincronizacionSignal.set('SINCRONIZADO');
        } else {
          this.estadoSincronizacionSignal.set('ERROR');
        }
      }
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

    return this.http.post<any>('/api/admin/tasa-bcv/sincronizar', {}).pipe(
      map((res) => {
        const val = moneda === 'USD' ? res?.usd : res?.eur;
        const vigencia = moneda === 'USD' ? res?.vigenciaUSD : res?.vigenciaEUR;
        if (res?.usd) this.tasaUsdSignal.set(Number(res.usd));
        if (res?.eur) this.tasaEurSignal.set(Number(res.eur));
        if (vigencia) this.fechaVigenciaSignal.set(vigencia);

        this.estadoSincronizacionSignal.set('SINCRONIZADO');
        this.snackBar.open(`Tasa ${moneda} sincronizada: Bs. ${val || this.tasaUsdSignal()}`, 'OK', { duration: 4000 });
        return true;
      }),
      catchError(() => {
        // Si el scraping externo da error de red pero ya hay tasa cargada en BD, esta sincronizado con el sistema
        const tasaActual = moneda === 'USD' ? this.tasaUsdSignal() : this.tasaEurSignal();
        if (tasaActual) {
          this.estadoSincronizacionSignal.set('SINCRONIZADO');
          this.snackBar.open(`Tasa ${moneda} ya esta sincronizada en el sistema (Bs. ${tasaActual}).`, 'Aviso', { duration: 4000 });
          return of(true);
        }
        this.estadoSincronizacionSignal.set('ERROR');
        this.snackBar.open('Error al sincronizar con el servicio oficial de tasas.', 'Cerrar', { duration: 5000 });
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
