import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number;
  totalQuestions: number;
  totalMarks: number;
  passingMarks: number;
  status: 'completed' | 'not-started' | 'failed';
  startTime: string;
  endTime: string;
}

interface ExamResult {
  id: string;
  examId: string;
  userId: string;
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unansweredQuestions: number;
  timeTaken: number;
  submittedAt: string;
  passingMarks: number;
}

@Component({
  selector: 'app-exams-page',
  templateUrl: './exams.page.html',
  styleUrls: ['./exams.page.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule]
})
export class ExamsPage implements OnInit {
  exams: Exam[] = [];
  filteredExams: Exam[] = [];
  selectedExam: Exam | null = null;
  showModal = false;
  searchTerm = '';
  selectedDuration = '';
  isFiltered = false;
  isLoading: boolean = true;
  error: string | null = null;
  apiUrl: string = 'http://localhost:3000';

  // Modal state
  showResultModal = false;
  selectedResult: ExamResult | null = null;

  // Statistics
  totalExams = 0;
  totalDuration = 0;
  totalMarks = 0;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadExams();
  }

  loadExams() {
    this.isLoading = true;
    this.error = null;
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser ? currentUser.id : null;
    if (!userId) {
      this.error = 'User not authenticated';
      this.isLoading = false;
      return;
    }
    this.http.get<any[]>(`${this.apiUrl}/exams`).subscribe({
      next: (exams) => {
        this.http.get<any[]>(`${this.apiUrl}/submissions?userId=${userId}`).subscribe({
          next: (submissions) => {
            this.exams = exams.map(exam => {
              const now = new Date();
              const endTime = new Date(exam.endTime);
              const submission = submissions.find(sub => sub.examId === exam.id);
              let status: 'completed' | 'not-started' | 'failed';
              if (submission) {
                status = 'completed';
              } else if (now > endTime) {
                status = 'failed';
              } else {
                status = 'not-started';
              }
              return {
                ...exam,
                status
              };
            });
            this.filteredExams = this.exams;
            this.calculateStatistics();
            this.isLoading = false;
          },
          error: (error) => {
            this.error = 'Failed to load exam status. Please try again later.';
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        this.error = 'Failed to load exams. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  calculateStatistics() {
    this.totalExams = this.exams.length;
    this.totalDuration = this.exams.reduce((sum, exam) => sum + (exam.duration || 0), 0);
    this.totalMarks = this.exams.reduce((sum, exam) => sum + (exam.totalMarks || 0), 0);
  }

  applyFilters() {
    this.filteredExams = this.exams.filter(exam => {
      const matchesSearch = exam.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                          exam.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesDuration = !this.selectedDuration || exam.duration <= parseInt(this.selectedDuration);
      return matchesSearch && matchesDuration;
    });
    this.isFiltered = this.searchTerm !== '' || this.selectedDuration !== '';
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedDuration = '';
    this.filteredExams = this.exams;
    this.isFiltered = false;
  }

  getExamStatus(exam: Exam): string {
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);

    if (exam.status === 'completed') {
      return 'completed';
    } else if (exam.status === 'failed') {
      return 'failed';
    } else if (now < startTime) {
      return 'upcoming';
    } else if (now > endTime) {
      return 'failed';
    } else {
      return 'available';
    }
  }

  getTimeRemaining(exam: Exam): string {
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);

    if (exam.status === 'failed') {
      return 'Exam period has ended';
    } else if (now < startTime) {
      return `Starts in ${this.calculateTimeRemaining(exam.startTime)}`;
    } else if (now > endTime) {
      return 'Exam period has ended';
    } else {
      const diff = endTime.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m remaining`;
    }
  }

  calculateTimeRemaining(startTime: string): string {
    const now = new Date();
    const start = new Date(startTime);
    const diff = start.getTime() - now.getTime();
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  canStartExam(exam: Exam): boolean {
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);
    
    return now >= startTime && now <= endTime && exam.status === 'not-started';
  }

  startExam(examId: string) {
    const exam = this.exams.find(e => e.id === examId);
    if (exam && this.canStartExam(exam)) {
      this.router.navigate(['/student/exams', examId]);
    }
  }

  closeModal() {
    this.showModal = false;
    this.selectedExam = null;
  }

  confirmStartExam() {
    if (this.selectedExam) {
      this.router.navigate(['/student/exams', this.selectedExam.id, 'take']);
    }
  }

  viewResult(examId: string) {
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser ? currentUser.id : null;
    if (!userId) {
      this.error = 'User not authenticated';
      return;
    }
    this.http.get<any[]>(`${this.apiUrl}/submissions?examId=${examId}&userId=${userId}&_sort=submittedAt&_order=desc&_limit=1`).subscribe({
      next: (submissions) => {
        if (submissions && submissions.length > 0) {
          const submission = submissions[0];
          // Now get the questions for this exam
          this.http.get<any[]>(`${this.apiUrl}/questions?examId=${examId}`).subscribe({
            next: (questions) => {
              let correctAnswers = 0;
              let wrongAnswers = 0;
              let unansweredQuestions = 0;
              questions.forEach((q: any) => {
                const userAnswer = submission.answers.find((a: any) => a.questionId === q.id);
                if (!userAnswer || !userAnswer.selectedAnswer) {
                  unansweredQuestions++;
                } else {
                  // Convert 1-based to 0-based index
                  const userAnswerIndex = parseInt(userAnswer.selectedAnswer) - 1;
                  if (userAnswerIndex === q.correctOption) {
                    correctAnswers++;
                  } else {
                    wrongAnswers++;
                  }
                }
              });
              const totalQuestions = questions.length;
              // Get passing marks from the exam object if needed
              this.http.get<any>(`${this.apiUrl}/exams/${examId}`).subscribe({
                next: (exam) => {
                  const passingMarks = exam && exam.passingMarks !== undefined && exam.passingMarks !== null ? exam.passingMarks : 50;
                  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
                  const passed = score >= passingMarks;
                  this.selectedResult = {
                    id: submission.id,
                    examId: submission.examId,
                    userId: submission.userId,
                    score,
                    passed,
                    totalQuestions,
                    correctAnswers,
                    wrongAnswers,
                    unansweredQuestions,
                    timeTaken: submission.timeTaken,
                    submittedAt: submission.submittedAt,
                    passingMarks
                  };
                  this.showResultModal = true;
                },
                error: (error) => {
                  this.error = 'Failed to load exam data.';
                }
              });
            },
            error: (error) => {
              this.error = 'Failed to load questions.';
            }
          });
        } else {
          this.error = 'No result found for this exam.';
        }
      },
      error: (error) => {
        this.error = 'Failed to load exam result. Please try again later.';
      }
    });
  }

  closeResultModal() {
    this.showResultModal = false;
    this.selectedResult = null;
  }

  getScoreClass(score: number): string {
    if (!score || isNaN(score)) return 'poor';
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'average';
    return 'poor';
  }

  getTimeTaken(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0m';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
}
