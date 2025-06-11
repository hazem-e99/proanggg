import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';

interface ExamSubmission {
  id: string;
  examId: string;
  userId: string;
  answers: Array<{
    questionId: string;
    selectedAnswer: string;
  }>;
  timeTaken: number;
  timestamp: string;
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unansweredQuestions: number;
  examTitle: string;
  passingMarks: number;
  status?: 'completed' | 'failed';
}

interface Exam {
  id: string;
  title: string;
  passingMarks: number;
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule, FormsModule, NgApexchartsModule],
  templateUrl: './results.page.html',
  styleUrls: ['./results.page.css']
})
export class ResultsPage implements OnInit {
  submissions: ExamSubmission[] = [];
  exams: Exam[] = [];
  apiUrl: string = 'http://localhost:3000';
  
  // Statistics
  averageScore: number = 0;
  highestScore: number = 0;
  totalExams: number = 0;
  failedExams: number = 0;
  isLoading: boolean = true;
  error: string | null = null;

  // Chart options
  public scoreDistributionChart: any = {
    series: [{
      name: 'Score',
      data: []
    }],
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: [],
      title: {
        text: 'Exams'
      }
    },
    yaxis: {
      title: {
        text: 'Score (%)'
      },
      max: 100
    },
    colors: ['#3498db']
  };

  public performanceChart: any = {
    series: [{
      name: 'Score',
      data: []
    }],
    chart: {
      type: 'line',
      height: 350,
      toolbar: {
        show: false
      }
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    markers: {
      size: 4
    },
    xaxis: {
      categories: [],
      title: {
        text: 'Date'
      }
    },
    yaxis: {
      title: {
        text: 'Score (%)'
      },
      max: 100
    },
    colors: ['#2ecc71']
  };

  public statusChart: any = {
    series: [0, 0],
    chart: {
      type: 'donut',
      height: 350
    },
    labels: ['Passed', 'Failed'],
    colors: ['#2ecc71', '#e74c3c'],
    legend: {
      position: 'bottom'
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 300
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadExams();
    this.loadSubmissions();
  }

  loadExams() {
    this.http.get<Exam[]>(`${this.apiUrl}/exams`).subscribe({
      next: (exams) => {
        this.exams = exams;
      },
      error: (error) => {
        console.error('Error loading exams:', error);
        this.error = 'Failed to load exams';
      }
    });
  }

  loadSubmissions() {
    const userId = "2"; // TODO: Get from auth service
    this.isLoading = true;
    this.error = null;

    // First load exams, then load submissions
    this.http.get<Exam[]>(`${this.apiUrl}/exams`).subscribe({
      next: (exams) => {
        this.exams = exams;
        // Now load submissions
        this.http.get<ExamSubmission[]>(`${this.apiUrl}/submissions?userId=${userId}&_sort=timestamp&_order=desc`)
          .subscribe({
            next: async (submissions) => {
              // Process and validate submissions with dynamic calculation
              const validSubmissions = await Promise.all(submissions.map(async sub => {
                // Find the exam for this submission
                const exam = this.exams.find(e => e.id === sub.examId);
                const passingMarks = exam && exam.passingMarks !== undefined && exam.passingMarks !== null ? exam.passingMarks : 50;
                // Get questions for this exam
                let questions: any[] = [];
                try {
                  questions = await this.http.get<any[]>(`${this.apiUrl}/questions?examId=${sub.examId}`).toPromise() as any[];
                } catch (e) {
                  questions = [];
                }
                const totalQuestions = questions.length;
                let correctAnswers = 0;
                let unansweredQuestions = 0;
                let wrongAnswers = 0;
                questions = questions || [];
                questions.forEach(q => {
                  const userAnswer = sub.answers.find((a: any) => a.questionId === q.id);
                  if (!userAnswer || userAnswer.selectedAnswer === '' || userAnswer.selectedAnswer === undefined) {
                    unansweredQuestions++;
                  } else {
                    const userAnswerIndex = Number(userAnswer.selectedAnswer) - 1;
                    if (userAnswerIndex === q.correctOption) {
                      correctAnswers++;
                    } else {
                      wrongAnswers++;
                    }
                  }
                });
                const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
                const passed = score >= passingMarks;
                return {
                  ...sub,
                  score,
                  totalQuestions,
                  correctAnswers,
                  wrongAnswers,
                  unansweredQuestions,
                  timeTaken: sub.timeTaken || 0,
                  passed,
                  passingMarks,
                  examTitle: exam ? exam.title : sub.examTitle || '',
                  timestamp: sub.timestamp || (exam && exam.startTime ? exam.startTime : ''),
                };
              }));

              // Add failed exams to submissions
              const now = new Date();
              const failedExams: ExamSubmission[] = this.exams
                .filter(exam => {
                  const endTime = new Date(exam.endTime);
                  return now > endTime && !validSubmissions.some(sub => sub.examId === exam.id);
                })
                .map(exam => ({
                  id: `failed-${exam.id}`,
                  examId: exam.id,
                  userId: userId,
                  answers: [],
                  timeTaken: 0,
                  timestamp: exam.endTime,
                  score: 0,
                  passed: false,
                  totalQuestions: 0,
                  correctAnswers: 0,
                  wrongAnswers: 0,
                  unansweredQuestions: 0,
                  examTitle: exam.title,
                  passingMarks: exam.passingMarks || 0,
                  status: 'failed' as const
                }));

              this.submissions = [...validSubmissions, ...failedExams];
              this.calculateStatistics();
              this.updateCharts();
              this.isLoading = false;
            },
            error: (error) => {
              console.error('Error loading submissions:', error);
              this.error = 'Failed to load exam submissions';
              this.isLoading = false;
            }
          });
      },
      error: (error) => {
        console.error('Error loading exams:', error);
        this.error = 'Failed to load exams';
        this.isLoading = false;
      }
    });
  }

  calculateStatistics() {
    console.log('Starting calculateStatistics with submissions:', this.submissions);
    
    if (this.submissions && this.submissions.length > 0) {
      // Filter out failed exams and get only completed submissions
      const validSubmissions = this.submissions.filter(submission => 
        submission.status === 'completed' || submission.passed
      );
      console.log('Valid submissions:', validSubmissions);

      // Count failed exams
      this.failedExams = this.submissions.filter(submission => 
        submission.status === 'failed' || !submission.passed
      ).length;
      console.log('Failed exams count:', this.failedExams);

      if (validSubmissions.length > 0) {
        // Calculate average score
        const totalScore = validSubmissions.reduce((sum, submission) => 
          sum + (submission.score || 0), 0);
        this.averageScore = Math.round((totalScore / validSubmissions.length) * 100) / 100;
        console.log('Total score:', totalScore, 'Average score:', this.averageScore);

        // Calculate highest score
        this.highestScore = Math.max(...validSubmissions.map(submission => submission.score || 0));
        console.log('Highest score:', this.highestScore);
      } else {
        this.averageScore = 0;
        this.highestScore = 0;
      }

      // Set total exams
      this.totalExams = this.submissions.length;
      console.log('Total exams:', this.totalExams);
    } else {
      this.averageScore = 0;
      this.highestScore = 0;
      this.totalExams = 0;
      this.failedExams = 0;
    }
  }

  getScoreClass(score: number): string {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'very-good';
    if (score >= 70) return 'good';
    if (score >= 60) return 'pass';
    return 'fail';
  }

  getStatusClass(submission: ExamSubmission): string {
    if (submission.status === 'failed') return 'failed';
    return submission.passed ? 'passed' : 'failed';
  }

  getStatusText(submission: ExamSubmission): string {
    if (submission.status === 'failed') return 'Failed';
    return submission.passed ? 'Passed' : 'Failed';
  }

  getTimeTaken(submission: ExamSubmission): string {
    if (submission.status === 'failed') return 'N/A';
    return `${submission.timeTaken} minutes`;
  }

  private updateCharts() {
    if (!this.submissions || this.submissions.length === 0) return;

    // Update Score Distribution Chart
    const scoreRanges = [0, 0, 0, 0, 0]; // 0-20, 21-40, 41-60, 61-80, 81-100
    this.submissions.forEach(sub => {
      const score = sub.score || 0;
      if (score <= 20) scoreRanges[0]++;
      else if (score <= 40) scoreRanges[1]++;
      else if (score <= 60) scoreRanges[2]++;
      else if (score <= 80) scoreRanges[3]++;
      else scoreRanges[4]++;
    });

    this.scoreDistributionChart.series[0].data = scoreRanges;
    this.scoreDistributionChart.xaxis.categories = ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'];

    // Update Performance Chart
    const sortedSubmissions = [...this.submissions].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    this.performanceChart.series[0].data = sortedSubmissions.map(sub => sub.score || 0);
    this.performanceChart.xaxis.categories = sortedSubmissions.map(sub => 
      new Date(sub.timestamp).toLocaleDateString()
    );

    // Update Status Chart
    const passedCount = this.submissions.filter(sub => sub.passed).length;
    const failedCount = this.submissions.length - passedCount;
    this.statusChart.series = [passedCount, failedCount];
  }
}
