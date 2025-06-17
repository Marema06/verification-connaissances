import { Component, Input } from '@angular/core';
import { QcmApiService, QcmResponse, QcmItem } from '../services/qcm-api.service';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-qcm',
  templateUrl: './qcm.component.html',
  imports: [
    FormsModule
  ],
  styleUrls: ['./qcm.component.css']
})
export class QcmComponent {
  @Input() author!: string;
  @Input() qcmId!: string;

  qcmData: QcmItem[] = [];
  answers: string[] = [];  // Stocke la réponse choisie par question (ex: "A", "B", "C")
  feedback: string = "";

  constructor(private qcmApi: QcmApiService) {}

  ngOnInit() {
    this.loadQcm();
  }

  loadQcm() {
    this.qcmApi.getQcmsByAuthor(this.author).subscribe({
      next: (res) => {
        const qcmObj = res.qcms.find(q => q.qcm_id === this.qcmId);
        if (qcmObj) {
          this.qcmData = qcmObj.qcm;
          this.answers = new Array(this.qcmData.length).fill(''); // init réponses vides
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
