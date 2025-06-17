// src/app/qcm/qcm.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QcmApiService, QcmResponse, QcmItem } from '../services/qcm-api.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-qcm',
  standalone: true,
  imports: [ CommonModule, FormsModule, HttpClientModule ],
  templateUrl: './qcm.component.html',
  styleUrls: ['./qcm.component.css']
})
export class QcmComponent implements OnInit {
  qcms: QcmResponse[] = [];
  // pour chaque QCM, on stocke les réponses sélectionnées
  userAnswers: number[][] = [];
  error = '';
  success = '';

  constructor(private qcmService: QcmApiService) {}

  ngOnInit() {
    this.loadQcms();
  }

  private loadQcms() {
    this.qcmService.getQcmsByAuthor().subscribe({
      next: res => {
        this.qcms = res.qcms;
        // initialiser userAnswers
        this.userAnswers = this.qcms.map(q =>
          Array(q.qcm.length).fill(-1)
        );
      },
      error: err => {
        console.error(err);
        this.error = 'Impossible de charger les QCM.';
      }
    });
  }

  submit(qcmIndex: number) {
    this.error = '';
    this.success = '';
    const answers = this.userAnswers[qcmIndex];
    if (answers.some(a => a < 0)) {
      this.error = 'Vous devez répondre à toutes les questions.';
      return;
    }
    const qcmId = this.qcms[qcmIndex].qcm_id;
    this.qcmService.submitAnswers(qcmId, answers).subscribe({
      next: () => this.success = 'Réponses envoyées ! 👍',
      error: () => this.error = 'Échec de l’envoi des réponses.'
    });
  }

  downloadPdf(qcmIndex: number) {
    const qcmId = this.qcms[qcmIndex].qcm_id;
    this.qcmService.generateTeacherPdf(qcmId)
      .subscribe(res => window.open(res.pdf_url, '_blank'));
  }
}
