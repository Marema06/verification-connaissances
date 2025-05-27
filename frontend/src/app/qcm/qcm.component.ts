import { Component, OnInit } from '@angular/core';
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
export class QcmComponent implements OnInit {
  qcmItems: QcmItem[] = [];
  userAnswers: number[] = [];
  error: string = '';
  successMessage: string = '';
  qcmId: string = '';
  author: string = 'anonymous';  // peut être dynamique selon auth

  constructor(private qcmApiService: QcmApiService) {}

  ngOnInit() {
    // Au chargement, on récupère le QCM déjà généré pour cet auteur
    this.loadQcm();
  }

  loadQcm() {
    this.qcmApiService.getQcm(this.author).subscribe({
      next: (res) => {
        if (res && res.qcm && res.qcm.length > 0) {
          this.qcmItems = res.qcm;
          this.qcmId = res.qcm_id;
          this.userAnswers = new Array(this.qcmItems.length).fill(-1);
        } else {
          this.error = "Aucun QCM généré pour cet utilisateur.";
        }
      },
      error: () => {
        this.error = "Erreur lors de la récupération du QCM.";
      }
    });
  }

  submitAnswers() {
    this.error = '';
    this.successMessage = '';
    if (this.userAnswers.includes(-1)) {
      this.error = "Veuillez répondre à toutes les questions.";
      return;
    }
    this.qcmApiService.submitAnswers(this.author, this.qcmId, this.userAnswers).subscribe({
      next: () => {
        this.successMessage = "Réponses enregistrées avec succès.";
      },
      error: () => {
        this.error = "Erreur lors de l'enregistrement des réponses.";
      }
    });
  }
}
