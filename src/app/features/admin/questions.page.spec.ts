import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionsPage } from './questions.page';

describe('QuestionsPage', () => {
  let component: QuestionsPage;
  let fixture: ComponentFixture<QuestionsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionsPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
