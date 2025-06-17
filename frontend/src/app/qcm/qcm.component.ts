import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { QcmApiService, QcmItem } from '../services/qcm-api.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { catchError, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-qcm',
  standalone: true, // ✅ Important pour Angular 17+
  templateUrl: './qcm.component.html',
  styleUrls: ['./qcm.component.css'],
  imports: [
    FormsModule,
    CommonModule
  ]
})
export class QcmComponent {
  private route = inject(ActivatedRoute);
  private qcmApi = inject(QcmApiService);

  // Données du QCM
  qcmData: QcmItem[] = [];
  answers: string[] = [];
  feedback: string = "";
  isLoading = true;

  // Solution pour le prerendering
  constructor() {
    this.route.paramMap.pipe(
      switchMap(params => {
        const author = params.get('author') || '';
        const qcmId = params.get('qcmId') || '';

        console.log('Chargement QCM pour:', author, qcmId);

        return this.qcmApi.getQcmsByAuthor(author).pipe(
          catchError(err => {
            console.error("Erreur API", err);
            return of({ qcms: [] });
          })
        );
      })
    ).subscribe({
      next: (res) => {
        const qcmObj = res.qcms.find(q => q.qcm_id === this.route.snapshot.paramMap.get('qcmId'));
        if (qcmObj) {
          this.qcmData = qcmObj.qcm;
          this.answers = new Array(this.qcmData.length).fill('');
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.feedback = "Erreur de chargement";
      }
    });
  }

  // Méthodes existantes conservées
  selectAnswer(questionIndex: number, choiceLetter: string) {
    this.answers[questionIndex] = choiceLetter;
  }

  submit() {
    if (this.answers.includes('')) {
      this.feedback = "Merci de répondre à toutes les questions avant de soumettre.";
      return;
    }

    const author = this.route.snapshot.paramMap.get('author') || '';
    const qcmId = this.route.snapshot.paramMap.get('qcmId') || '';

    this.qcmApi.submitAnswers(author, qcmId, this.answers).subscribe({
      next: () => this.feedback = "Réponses soumises avec succès !",
      error: (err) => {
        this.feedback = "Erreur lors de la soumission : " + (err.error?.message || err.message);
      }
    });
  }
}
