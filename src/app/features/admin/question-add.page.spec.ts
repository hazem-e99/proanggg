import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionAddPage } from './question-add.page';

describe('QuestionAddPage', () => {
  let component: QuestionAddPage;
  let fixture: ComponentFixture<QuestionAddPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionAddPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionAddPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
