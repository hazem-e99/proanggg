import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamsPage } from './exams.page';

describe('ExamsPage', () => {
  let component: ExamsPage;
  let fixture: ComponentFixture<ExamsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamsPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
