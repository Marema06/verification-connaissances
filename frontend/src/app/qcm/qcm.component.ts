import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { CommonModule } from '@angular/common'; // Import ajouté
import { FormsModule } from '@angular/forms';   // Import ajouté

@Component({
  selector: 'app-qcm',
  standalone: true,      // Ajouté
  imports: [CommonModule, FormsModule], // Imports ajoutés
  templateUrl: './qcm.component.html',
  styleUrls: ['./qcm.component.css']
})
export class QcmComponent implements OnInit {
  qcmId: string = '';
  questions: any[] = [];
  answers: { [key: string]: string } = {};
  isLoading = true;
  errorMessage = '';
  isSubmitted = false;
  score: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const author = params.get('author') ?? undefined;
      const qcmId = params.get('qcmId');

      if (qcmId) {
        this.qcmId = qcmId;
        this.loadQcm(author);  // on passe l'auteur si disponible
      } else {
        this.errorMessage = 'ID de QCM manquant dans l\'URL';
        this.isLoading = false;
      }
    });
  }

  loadQcm(author?: string) {
    let url = author
      ? `http://localhost:5000/qcm/${author}/${this.qcmId}`
      : `http://localhost:5000/qcm/${this.qcmId}`;

    this.http.get<any>(url)
      .pipe(
        catchError(err => {
          this.isLoading = false;
          this.errorMessage = 'Erreur de chargement du QCM';
          return throwError(err);
        })
      )
      .subscribe({
        next: (data) => {
          this.questions = data.questions || [];
          this.isLoading = false;
        },
        error: (err) => {
          console.error(err);
        }
      });
  }


  submitAnswers() {
    this.isSubmitted = true;

    // Calcul du score
    this.score = this.questions.reduce((total, question, index) => {
      const userAnswer = this.answers[index];
      const correctAnswer = this.getCorrectAnswer(question);
      return total + (userAnswer === correctAnswer ? 1 : 0);
    }, 0);

    // Envoi des réponses au backend
    this.http.post('http://localhost:5000/submit', {
      qcm_id: this.qcmId,
      answers: this.answers
    }).subscribe({
      next: () => console.log('Réponses enregistrées'),
      error: (err) => console.error('Erreur d\'enregistrement', err)
    });
  }

  getCorrectAnswer(question: any): string {
    return question.answer;
  }

  getAnswerExplanation(question: any, answer: string): string {
    if (answer === question.answer) {
      return `✓ Correct: ${question.explanation}`;
    }
    return `✗ Incorrect. La bonne réponse est: ${question.answer}`;
  }
}
