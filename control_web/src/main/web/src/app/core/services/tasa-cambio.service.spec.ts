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

  it('Caso A: Sincronizacion exitosa via endpoint de servidor -> actualiza signals y estado', (done) => {
    service.sincronizarMoneda('USD').subscribe(actualizado => {
      expect(actualizado).toBeTrue();
      expect(service.tasaUsdSignal()).toBe(887.30);
      expect(service.estadoSincronizacionSignal()).toBe('SINCRONIZADO');
      done();
    });

    const reqPost = httpMock.expectOne('/api/admin/tasa-bcv/sincronizar');
    expect(reqPost.request.method).toBe('POST');
    reqPost.flush({
      usd: 887.30,
      eur: 994.00,
      vigenciaUSD: '2026-10-27',
      vigenciaEUR: '2026-10-27'
    });
  });

  it('Caso B: Error de scraping externo en servidor pero ya existe tasa en BD -> Mantiene SINCRONIZADO', (done) => {
    // service ya tiene tasaUsdSignal = 45.00 cargada en beforeEach
    service.sincronizarMoneda('USD').subscribe(actualizado => {
      expect(actualizado).toBeTrue();
      expect(service.estadoSincronizacionSignal()).toBe('SINCRONIZADO');
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringMatching(/ya esta sincronizada/),
        'Aviso',
        jasmine.any(Object)
      );
      done();
    });

    const reqPost = httpMock.expectOne('/api/admin/tasa-bcv/sincronizar');
    reqPost.error(new ProgressEvent('Server Error'));
  });
});
