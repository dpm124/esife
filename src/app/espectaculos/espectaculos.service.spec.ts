import { TestBed } from '@angular/core/testing';
import { EspectaculosService } from './espectaculos.service';

describe('EspectaculosService', () => {
  let service: EspectaculosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EspectaculosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
