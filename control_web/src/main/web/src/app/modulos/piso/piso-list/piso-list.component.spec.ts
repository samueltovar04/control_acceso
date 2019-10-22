import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PisoListComponent } from './piso-list.component';

describe('PisoListComponent', () => {
  let component: PisoListComponent;
  let fixture: ComponentFixture<PisoListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PisoListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PisoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
