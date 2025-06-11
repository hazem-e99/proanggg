import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamsAddPage } from './exams-add.page';

describe('ExamsAddPage', () => {
  let component: ExamsAddPage;
  let fixture: ComponentFixture<ExamsAddPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamsAddPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamsAddPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
