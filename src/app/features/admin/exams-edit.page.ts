import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-exams-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule],
  templateUrl: './exams-edit.page.html',
})
export class ExamsEditPage {
  examId!: number;
  form: ReturnType<FormBuilder['group']>;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: [''],
    });
    this.examId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadExam();
  }

  loadExam() {
    this.http.get<any>(`http://localhost:3000/exams/${this.examId}`).subscribe((exam) => {
      this.form.patchValue(exam);
    });
  }

  save() {
    if (this.form.valid) {
      this.http
        .put(`http://localhost:3000/exams/${this.examId}`, this.form.value)
        .subscribe(() => {
          this.router.navigate(['/admin/exams']);
        });
    }
  }
}
