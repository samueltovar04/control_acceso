import { TestBed, inject } from '@angular/core/testing';

import { VisitanteService } from './visitante.service';

describe('VisitanteService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VisitanteService]
    });
  });

  it('should be created', inject([VisitanteService], (service: VisitanteService) => {
    expect(service).toBeTruthy();
  }));
});
