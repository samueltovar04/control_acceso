import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitanteDetailsComponent } from './visitante-details.component';

describe('VisitanteDetailsComponent', () => {
  let component: VisitanteDetailsComponent;
  let fixture: ComponentFixture<VisitanteDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VisitanteDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VisitanteDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
