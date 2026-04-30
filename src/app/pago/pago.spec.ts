import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { PagoComponent } from './pago';
import { PagosService } from './pagoService';

describe('PagoComponent', () => {
  let component: PagoComponent;
  let fixture: ComponentFixture<PagoComponent>;
  let pagosService: PagosService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PagoComponent, HttpClientTestingModule],
      providers: [
        PagosService,
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({})
          }
        },
        {
          provide: Router,
          useValue: {
            navigate: () => Promise.resolve(true)
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PagoComponent);
    component = fixture.componentInstance;
    pagosService = TestBed.inject(PagosService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with error when tokens are missing', async () => {
    await fixture.whenStable();
    expect(component.estado).toBe('ERROR');
  });
});