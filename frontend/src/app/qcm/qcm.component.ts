import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QcmApiService, QcmItem } from '../services/qcm-api.service';
import { HttpClientModule } from '@angular/common/http';
import { environment } from '../../environments/environment';

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
  author: string = 'github-action';  // ou 'anonymous', selon ton contexte
  apiUrl = environment.apiUrl;

  constructor(private qcmApiService: QcmApiService) {}

  ngOnInit() {
    this.loadQcm();
  }

  loadQcm() {
    this.qcmApiService.getQcm(this.author).subscribe({
      next: (res) => {
        if (res && res.qcm && res.qcm.length > 0) {
          this.qcmItems = res.qcm;
          this.qcmId = res.qcm_id;
          this.userAnswers = new Array(this.qcmItems.length).fill(-1);
          this.error = '';
          this.successMessage = '';
        } else {
          this.error = "Aucun QCM disponible pour cet utilisateur.";
          this.qcmItems = [];
          this.qcmId = '';
        }
      },
      error: (err) => {
        this.error = "Erreur lors de la récupération du QCM.";
        console.error(err);
        this.qcmItems = [];
        this.qcmId = '';
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
