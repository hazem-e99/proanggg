import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './login.page.html',
})
export class AdminLoginPage {
  form: any; // Will be initialized in constructor

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  login() {
    const { email, password } = this.form.value;
    this.http
      .get<any[]>(`http://localhost:3000/users?role=admin&email=${email}&password=${password}`)
      .subscribe((res) => {
        if (res.length > 0) {
          localStorage.setItem('currentUser', JSON.stringify(res[0]));
          this.router.navigate(['/admin']);
        } else {
          alert('Invalid login credentials');
        }
      });
  }
}
