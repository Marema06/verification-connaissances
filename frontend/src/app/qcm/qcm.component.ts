import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QcmApiService, QcmItem } from '../services/qcm-api.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-qcm',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './qcm.component.html',
  styleUrls: ['./qcm.component.css']
})
export class QcmComponent {
  codeBlock: string = '';
  qcmItems: QcmItem[] = [];
  userAnswers: number[] = [];
  error: string = '';
  successMessage: string = '';
  qcmId: string = '';
  author: string = 'anonymous';  // Ou récupère d’une autre source (authentification)

  constructor(private qcmApiService: QcmApiService) {}

  generateQcm() {
    this.error = '';
    this.successMessage = '';
    if (!this.codeBlock.trim()) {
      this.error = "Le code ne peut pas être vide.";
      return;
    }
    this.qcmApiService.generateQcm(this.codeBlock).subscribe({
      next: (res) => {
        this.qcmItems = res.qcm;
        this.qcmId = res.qcm_id;
        this.userAnswers = new Array(this.qcmItems.length).fill(-1);
      },
      error: (err) => {
        this.error = "Erreur lors de la génération du QCM.";
      }
    });
  }

  submitAnswers() {
    if (this.userAnswers.includes(-1)) {
      this.error = "Veuillez répondre à toutes les questions.";
      return;
    }
    this.qcmApiService.submitAnswers(this.author, this.qcmId, this.userAnswers).subscribe({
      next: () => {
        this.successMessage = "Réponses enregistrées avec succès.";
        this.error = '';
      },
      error: () => {
        this.error = "Erreur lors de l'enregistrement des réponses.";
      }
    });
  }
}
