import { TestBed, inject } from '@angular/core/testing';

import { DispositivoService } from './dispositivo.service';

describe('DispositivoService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DispositivoService]
    });
  });

  it('should be created', inject([DispositivoService], (service: DispositivoService) => {
    expect(service).toBeTruthy();
  }));
});
