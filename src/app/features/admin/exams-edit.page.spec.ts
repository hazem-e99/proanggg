import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamsEditPage } from './exams-edit.page';

describe('ExamsEditPage', () => {
  let component: ExamsEditPage;
  let fixture: ComponentFixture<ExamsEditPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamsEditPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamsEditPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
