import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { QcmApiService, QcmItem } from '../services/qcm-api.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-qcm',
  templateUrl: './qcm.component.html',
  imports: [
    FormsModule,
    CommonModule
  ],
  styleUrls: ['./qcm.component.css']
})
export class QcmComponent {
  author!: string;
  qcmId!: string;

  qcmData: QcmItem[] = [];
  answers: string[] = [];
  feedback: string = "";

  constructor(private qcmApi: QcmApiService, private route: ActivatedRoute) {}

  ngOnInit() {
    // Récupère les paramètres URL
    this.author = this.route.snapshot.paramMap.get('author') || '';
    this.qcmId = this.route.snapshot.paramMap.get('qcmId') || '';

    this.loadQcm();
  }

  loadQcm() {
    console.log('Author:', this.author, 'QcmId:', this.qcmId);
    this.qcmApi.getQcmsByAuthor(this.author).subscribe({
      next: (res) => {
        console.log('QCMs reçus du backend :', res.qcms); // 🔍 Important
        const qcmObj = res.qcms.find(q => q.qcm_id === this.qcmId);
        if (qcmObj) {
          this.qcmData = qcmObj.qcm;
          this.answers = new Array(this.qcmData.length).fill('');
        } else {
          console.warn('Aucun QCM trouvé avec cet ID');
        }
      },
      error: (err) => {
        console.error("Erreur chargement QCM", err);
      }
    });
  }
  selectAnswer(questionIndex: number, choiceLetter: string) {
    this.answers[questionIndex] = choiceLetter;
  }

  submit() {
    if (this.answers.includes('')) {
      this.feedback = "Merci de répondre à toutes les questions avant de soumettre.";
      return;
    }

    this.qcmApi.submitAnswers(this.author, this.qcmId, this.answers).subscribe({
      next: (res) => {
        this.feedback = "Réponses soumises avec succès !";
      },
      error: (err) => {
        this.feedback = "Erreur lors de la soumission : " + (err.error?.message || err.message);
      }
    });
  }
}
