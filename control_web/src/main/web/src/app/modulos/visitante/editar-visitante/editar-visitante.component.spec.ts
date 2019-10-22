import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearVisitanteComponent } from './crear-visitante.component';

describe('CrearVisitanteComponent', () => {
  let component: CrearVisitanteComponent;
  let fixture: ComponentFixture<CrearVisitanteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CrearVisitanteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CrearVisitanteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
