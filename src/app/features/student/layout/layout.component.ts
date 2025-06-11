import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StudentSidebarComponent } from '../sidebar/sidebar.component';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [RouterOutlet, StudentSidebarComponent, HttpClientModule],
  providers: [HttpClientModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class StudentLayoutComponent {
} 