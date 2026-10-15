import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TasaCambioService, DolarApiResponse, BackendTasaResponse } from './tasa-cambio.service';

describe('TasaCambioService - Sincronizacion Condicional BCV', () => {
  let service: TasaCambioService;
  let httpMock: HttpTestingController;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MatSnackBarModule],
      providers: [
        TasaCambioService,
        { provide: MatSnackBar, useValue: spy }
      ]
    });

    service = TestBed.inject(TasaCambioService);
    httpMock = TestBed.inject(HttpTestingController);
    snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    const reqUsd = httpMock.expectOne('/api/tasas/actual?moneda=USD');
    const reqEur = httpMock.expectOne('/api/tasas/actual?moneda=EUR');
    reqUsd.flush({ moneda: 'USD', tasa: 45.00, fecha: '2026-10-13', vigente: true });
    reqEur.flush({ moneda: 'EUR', tasa: 49.00, fecha: '2026-10-13', vigente: true });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('Caso A: Tasa externa mayor a la de BD -> debe ejecutar POST /api/tasas/registrar', (done) => {
    const mockExterna: DolarApiResponse = {
      moneda: 'USD',
      fuente: 'oficial',
      nombre: 'Dolar',
      promedio: 46.50,
      fechaActualizacion: '2026-10-14T18:00:00Z'
    };
    const mockBd: BackendTasaResponse = {
      moneda: 'USD',
      tasa: 45.00,
      fecha: '2026-10-13',
      vigente: true
    };

    service.sincronizarMoneda('USD').subscribe(actualizado => {
      expect(actualizado).toBeTrue();
      done();
    });

    const reqExt = httpMock.expectOne('https://ve.dolarapi.com/v1/dolares/oficial');
    const reqBd = httpMock.expectOne('/api/tasas/actual?moneda=USD');

    reqExt.flush(mockExterna);
    reqBd.flush(mockBd);

    const reqPost = httpMock.expectOne('/api/tasas/registrar');
    expect(reqPost.request.method).toBe('POST');
    expect(reqPost.request.body.tasa).toBe(46.50);
    reqPost.flush({ success: true });

    expect(service.tasaUsdSignal()).toBe(46.50);
    expect(snackBarSpy.open).toHaveBeenCalled();
  });

  it('Caso B: Tasa externa menor o igual a la de BD -> NO debe llamar a POST y emite alerta', (done) => {
    const mockExterna: DolarApiResponse = {
      moneda: 'USD',
      fuente: 'oficial',
      nombre: 'Dolar',
      promedio: 44.80,
      fechaActualizacion: '2026-10-14T18:00:00Z'
    };
    const mockBd: BackendTasaResponse = {
      moneda: 'USD',
      tasa: 45.00,
      fecha: '2026-10-14',
      vigente: true
    };

    service.sincronizarMoneda('USD').subscribe(actualizado => {
      expect(actualizado).toBeFalse();
      done();
    });

    const reqExt = httpMock.expectOne('https://ve.dolarapi.com/v1/dolares/oficial');
    const reqBd = httpMock.expectOne('/api/tasas/actual?moneda=USD');

    reqExt.flush(mockExterna);
    reqBd.flush(mockBd);

    httpMock.expectNone('/api/tasas/registrar');
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      jasmine.stringMatching(/no supera la registrada en base de datos/),
      'Aviso',
      jasmine.any(Object)
    );
  });

  it('Caso C: Error de red en DolarAPI -> Maneja error sin romper y preserva tasa en BD', (done) => {
    service.sincronizarMoneda('USD').subscribe(actualizado => {
      expect(actualizado).toBeFalse();
      expect(service.estadoSincronizacionSignal()).toBe('ERROR');
      done();
    });

    const reqExt = httpMock.expectOne('https://ve.dolarapi.com/v1/dolares/oficial');
    const reqBd = httpMock.expectOne('/api/tasas/actual?moneda=USD');

    reqExt.error(new ProgressEvent('Network Error'));
    reqBd.flush({ moneda: 'USD', tasa: 45.00, fecha: '2026-10-13', vigente: true });

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      jasmine.stringMatching(/Error al conectar/),
      'Cerrar',
      jasmine.any(Object)
    );
  });
});
