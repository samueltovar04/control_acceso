import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DispositivoListComponent } from './dispositivo-list.component';

describe('DispositivoListComponent', () => {
  let component: DispositivoListComponent;
  let fixture: ComponentFixture<DispositivoListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DispositivoListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DispositivoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
