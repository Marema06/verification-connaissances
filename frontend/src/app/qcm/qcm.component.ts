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
  author: string = 'anonymous';

  constructor(private qcmApiService: QcmApiService) {}

  ngOnInit() {
    console.log("ngOnInit called");
    this.loadQcm();
  }

  loadQcm() {
    console.log("loadQcm called");
    this.qcmApiService.getQcm(this.author).subscribe({
      next: (res) => {
        console.log("QCM reçu :", res);
        if (res && res.qcm && res.qcm.length > 0) {
          this.qcmItems = res.qcm;
          this.qcmId = res.qcm_id;

          // Initialisation de userAnswers uniquement si taille différente
          if (this.userAnswers.length !== this.qcmItems.length) {
            this.userAnswers = new Array(this.qcmItems.length).fill(-1);
          }

          this.error = '';
        } else {
          this.qcmItems = [];
          this.qcmId = '';
          this.error = "Aucun QCM généré pour cet utilisateur.";
        }
      },
      error: (err) => {
        this.qcmItems = [];
        this.qcmId = '';
        this.error = "Erreur lors de la récupération du QCM.";
        console.error("Erreur QCM", err);
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

  trackByIndex(index: number, item: QcmItem): number {
    return index;
  }
}
