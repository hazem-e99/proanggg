import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-question-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule],
  templateUrl: './question-edit.page.html',
})
export class QuestionEditPage {
  form: ReturnType<FormBuilder['group']>;
  id!: number;
  examId!: number;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {
    this.form = this.fb.group({
      text: ['', Validators.required],
      option1: ['', Validators.required],
      option2: ['', Validators.required],
      option3: ['', Validators.required],
      option4: ['', Validators.required],
      correctAnswer: ['', Validators.required],
    });
    this.id = Number(this.route.snapshot.queryParamMap.get('id'));
    this.loadQuestion();
  }

  loadQuestion() {
    this.http.get<any>(`http://localhost:3000/questions/${this.id}`).subscribe((q) => {
      this.examId = q.examId;
      this.form.patchValue({
        text: q.text,
        option1: q.options[0],
        option2: q.options[1],
        option3: q.options[2],
        option4: q.options[3],
        correctAnswer: q.correctAnswer,
      });
    });
  }

  save() {
    if (this.form.valid) {
      const values = this.form.value;
      const question = {
        examId: this.examId,
        text: values.text,
        options: [values.option1, values.option2, values.option3, values.option4],
        correctAnswer: values.correctAnswer,
      };

      this.http.put(`http://localhost:3000/questions/${this.id}`, question).subscribe(() => {
        this.router.navigate(['/admin/questions'], {
          queryParams: { examId: this.examId },
        });
      });
    }
  }
}
