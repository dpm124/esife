import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Cola } from './cola';

describe('Cola', () => {
  let component: Cola;
  let fixture: ComponentFixture<Cola>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cola],
    }).compileComponents();

    fixture = TestBed.createComponent(Cola);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
