import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { SedeStateService } from '../sede/sede-state.service';

export interface DispositivoBiometrico {
  id: string | number;
  nombre: string;
  ip: string;
  port: number;
  host: string;
  ruta?: string;
  urlCompleta?: string;
  tipo: string;
  sedeId?: number | null;
  sedeNombre?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BiometricDeviceStateService {
  private readonly STORAGE_KEY_CAPTAHUELLAS = 'control_acceso_captahuellas_host';
  private readonly STORAGE_KEY_CAMARA = 'control_acceso_camara_id';

  public readonly CAPTAHUELLAS_DEFAULT: DispositivoBiometrico = {
    id: 'LOCAL_8085',
    nombre: 'Localhost:8085 (Sensor USB Local)',
    ip: '127.0.0.1',
    port: 8085,
    host: '127.0.0.1:8085',
    tipo: 'Captahuellas USB Suprema'
  };

  public readonly CAMARA_DEFAULT: DispositivoBiometrico = {
    id: 'LOCAL_WEBCAM',
    nombre: 'Camara Web Local (Navegador)',
    ip: '',
    port: 0,
    host: '',
    tipo: 'Camara Web'
  };

  private todosDispositivos$ = new BehaviorSubject<any[]>([]);
  private captahuellasSeleccionadoSubject = new BehaviorSubject<DispositivoBiometrico>(this.CAPTAHUELLAS_DEFAULT);
  private camaraSeleccionadaSubject = new BehaviorSubject<DispositivoBiometrico>(this.CAMARA_DEFAULT);

  public captahuellasSeleccionado$ = this.captahuellasSeleccionadoSubject.asObservable();
  public camaraSeleccionada$ = this.camaraSeleccionadaSubject.asObservable();

  public captahuellasDisponibles$: Observable<DispositivoBiometrico[]>;
  public camarasDisponibles$: Observable<DispositivoBiometrico[]>;

  constructor(
    private http: HttpClient,
    private sedeStateService: SedeStateService
  ) {
    this.recuperarSeleccionesGuardadas();
    this.recargarDispositivos();

    this.captahuellasDisponibles$ = combineLatest([
      this.todosDispositivos$,
      this.sedeStateService.sedeSeleccionadaId$
    ]).pipe(
      map(([dispositivos, sedeId]) => {
        const filtrados: DispositivoBiometrico[] = [{ ...this.CAPTAHUELLAS_DEFAULT }];
        const items = (dispositivos || []).filter(d => {
          const tipo = `${d.tipoDispositivo || ''} ${d.tipo || ''} ${d.nombre || ''} ${d.descripcion || ''}`.toLowerCase();
          const esHuella = tipo.includes('captahuella') || tipo.includes('huella') || d.port === 8085;
          if (!esHuella) return false;
          if (sedeId === null || sedeId === undefined) return true;
          const sId = d.piso?.sede?.id || d.piso?.sede_id || d.piso?.sedeId;
          return sId !== undefined && sId !== null && Number(sId) === Number(sedeId);
        });

        items.forEach(d => {
          const ip = d.ip || '127.0.0.1';
          const port = d.port || 8085;
          const host = `${ip}:${port}`;
          const sedeNom = d.piso?.sede?.sede || d.piso?.sede?.nombre || '';
          filtrados.push({
            id: d.id,
            nombre: `${d.descripcion || d.nombre || 'Captahuellas'} (${host})${sedeNom ? ' [' + sedeNom + ']' : ''}`,
            ip,
            port,
            host,
            tipo: d.tipoDispositivo || 'Captahuellas USB Suprema',
            sedeId: d.piso?.sede?.id || d.piso?.sede_id || null,
            sedeNombre: sedeNom
          });
        });
        return filtrados;
      })
    );

    this.camarasDisponibles$ = combineLatest([
      this.todosDispositivos$,
      this.sedeStateService.sedeSeleccionadaId$
    ]).pipe(
      map(([dispositivos, sedeId]) => {
        const filtradas: DispositivoBiometrico[] = [{ ...this.CAMARA_DEFAULT }];
        const items = (dispositivos || []).filter(d => {
          const tipo = `${d.tipoDispositivo || ''} ${d.tipo || ''} ${d.nombre || ''} ${d.descripcion || ''}`.toLowerCase();
          const esCamara = tipo.includes('camara') || tipo.includes('cámara');
          if (!esCamara) return false;
          if (sedeId === null || sedeId === undefined) return true;
          const sId = d.piso?.sede?.id || d.piso?.sede_id || d.piso?.sedeId;
          return sId !== undefined && sId !== null && Number(sId) === Number(sedeId);
        });

        items.forEach(d => {
          const ip = d.ip || '';
          const port = d.port || 80;
          const ruta = d.ruta ? (d.ruta.startsWith('/') ? d.ruta : `/${d.ruta}`) : '';
          const host = ip ? `${ip}:${port}` : '';
          const urlCompleta = ip ? `${ip}:${port}${ruta}` : '';
          const sedeNom = d.piso?.sede?.sede || d.piso?.sede?.nombre || '';
          filtradas.push({
            id: d.id,
            nombre: `${d.descripcion || d.nombre || 'Camara IP'} (${urlCompleta || host || 'Web'})${sedeNom ? ' [' + sedeNom + ']' : ''}`,
            ip,
            port,
            host,
            ruta: d.ruta,
            urlCompleta,
            tipo: d.tipoDispositivo || 'Camara IP',
            sedeId: d.piso?.sede?.id || d.piso?.sede_id || null,
            sedeNombre: sedeNom
          });
        });
        return filtradas;
      })
    );
  }

  public recargarDispositivos(): void {
    this.http.get<any[]>('/api/v1/dispositivos').subscribe({
      next: (data) => {
        this.todosDispositivos$.next(data || []);
        this.sincronizarConDispositivosCargados(data || []);
      },
      error: () => this.todosDispositivos$.next([])
    });
  }

  public seleccionarCaptahuellas(hostOId: string | number): void {
    if (!hostOId || hostOId === 'LOCAL_8085' || hostOId === '127.0.0.1:8085') {
      this.captahuellasSeleccionadoSubject.next(this.CAPTAHUELLAS_DEFAULT);
      localStorage.setItem(this.STORAGE_KEY_CAPTAHUELLAS, this.CAPTAHUELLAS_DEFAULT.host);
      return;
    }

    const todos = this.todosDispositivos$.value;
    const encontrado = todos.find(d => {
      const host = `${d.ip}:${d.port}`;
      return String(d.id) === String(hostOId) || host === String(hostOId);
    });

    if (encontrado) {
      const ip = encontrado.ip || '127.0.0.1';
      const port = encontrado.port || 8085;
      const host = `${ip}:${port}`;
      const item: DispositivoBiometrico = {
        id: encontrado.id,
        nombre: `${encontrado.descripcion || encontrado.nombre} (${host})`,
        ip,
        port,
        host,
        tipo: encontrado.tipoDispositivo || 'Captahuellas USB Suprema'
      };
      this.captahuellasSeleccionadoSubject.next(item);
      localStorage.setItem(this.STORAGE_KEY_CAPTAHUELLAS, host);
    } else {
      // Si es un host arbitrario pasado como string
      const hostStr = String(hostOId);
      const parts = hostStr.split(':');
      const item: DispositivoBiometrico = {
        id: hostStr,
        nombre: `Captahuellas (${hostStr})`,
        ip: parts[0] || '127.0.0.1',
        port: parts[1] ? Number(parts[1]) : 8085,
        host: hostStr,
        tipo: 'Captahuellas USB Suprema'
      };
      this.captahuellasSeleccionadoSubject.next(item);
      localStorage.setItem(this.STORAGE_KEY_CAPTAHUELLAS, hostStr);
    }
  }

  public seleccionarCamara(id: string | number): void {
    if (!id || id === 'LOCAL_WEBCAM') {
      this.camaraSeleccionadaSubject.next(this.CAMARA_DEFAULT);
      localStorage.setItem(this.STORAGE_KEY_CAMARA, 'LOCAL_WEBCAM');
      return;
    }

    const todos = this.todosDispositivos$.value;
    const encontrado = todos.find(d => String(d.id) === String(id));
    if (encontrado) {
      const ip = encontrado.ip || '';
      const port = encontrado.port || 80;
      const ruta = encontrado.ruta ? (encontrado.ruta.startsWith('/') ? encontrado.ruta : `/${encontrado.ruta}`) : '';
      const host = ip ? `${ip}:${port}` : '';
      const urlCompleta = ip ? `${ip}:${port}${ruta}` : '';
      const item: DispositivoBiometrico = {
        id: encontrado.id,
        nombre: `${encontrado.descripcion || encontrado.nombre} (${urlCompleta || host || 'Web'})`,
        ip,
        port,
        host,
        ruta: encontrado.ruta,
        urlCompleta,
        tipo: encontrado.tipoDispositivo || 'Camara IP'
      };
      this.camaraSeleccionadaSubject.next(item);
      localStorage.setItem(this.STORAGE_KEY_CAMARA, String(encontrado.id));
    } else {
      this.camaraSeleccionadaSubject.next(this.CAMARA_DEFAULT);
      localStorage.setItem(this.STORAGE_KEY_CAMARA, 'LOCAL_WEBCAM');
    }
  }

  public getHostCaptahuellasActual(): string {
    return this.captahuellasSeleccionadoSubject.value.host || '127.0.0.1:8085';
  }

  public getCamaraActual(): DispositivoBiometrico {
    return this.camaraSeleccionadaSubject.value;
  }

  private sincronizarConDispositivosCargados(dispositivos: any[]): void {
    const savedHost = localStorage.getItem(this.STORAGE_KEY_CAPTAHUELLAS);
    if (savedHost && savedHost !== '127.0.0.1:8085') {
      const d = dispositivos.find(x => `${x.ip}:${x.port}` === savedHost);
      if (d) {
        this.seleccionarCaptahuellas(d.id);
      }
    }

    const savedCamId = localStorage.getItem(this.STORAGE_KEY_CAMARA);
    if (savedCamId && savedCamId !== 'LOCAL_WEBCAM') {
      const d = dispositivos.find(x => String(x.id) === String(savedCamId));
      if (d) {
        this.seleccionarCamara(d.id);
      }
    }
  }

  private recuperarSeleccionesGuardadas(): void {
    const savedHost = localStorage.getItem(this.STORAGE_KEY_CAPTAHUELLAS);
    if (savedHost && savedHost !== '127.0.0.1:8085') {
      const parts = savedHost.split(':');
      this.captahuellasSeleccionadoSubject.next({
        id: 'SAVED_' + savedHost,
        nombre: `Captahuellas (${savedHost})`,
        ip: parts[0] || '127.0.0.1',
        port: parts[1] ? Number(parts[1]) : 8085,
        host: savedHost,
        tipo: 'Captahuellas USB Suprema'
      });
    }
  }
}
