import { TestBed, inject } from '@angular/core/testing';

import { PisoService } from './piso.service';

describe('PisoService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PisoService]
    });
  });

  it('should be created', inject([PisoService], (service: PisoService) => {
    expect(service).toBeTruthy();
  }));
});
