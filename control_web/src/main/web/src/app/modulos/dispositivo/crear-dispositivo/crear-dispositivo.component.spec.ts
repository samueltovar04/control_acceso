import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearDispositivoComponent } from './crear-dispositivo.component';

describe('CrearDispositivoComponent', () => {
  let component: CrearDispositivoComponent;
  let fixture: ComponentFixture<CrearDispositivoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CrearDispositivoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CrearDispositivoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
