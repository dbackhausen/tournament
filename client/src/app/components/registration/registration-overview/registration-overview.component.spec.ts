import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistrationOverviewComponent } from './registration-overview.component';

describe('RegistrationOverviewComponent', () => {
  let component: RegistrationOverviewComponent;
  let fixture: ComponentFixture<RegistrationOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrationOverviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrationOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
