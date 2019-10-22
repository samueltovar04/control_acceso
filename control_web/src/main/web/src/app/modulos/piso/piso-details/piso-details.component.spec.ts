import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PisoDetailsComponent } from './piso-details.component';

describe('PisoDetailsComponent', () => {
  let component: PisoDetailsComponent;
  let fixture: ComponentFixture<PisoDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PisoDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PisoDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
