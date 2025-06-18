import { Component, OnInit } from '@angular/core';
import { QcmApiService, QcmItem, QcmResponse } from '../services/qcm-api.service';
import { ActivatedRoute } from '@angular/router';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-qcm',
  templateUrl: './qcm.component.html',
  imports: [
    FormsModule
  ],
  styleUrls: ['./qcm.component.css']
})
export class QcmComponent implements OnInit {
  questions: QcmItem[] = [];
  answers: string[] = [];
  studentName = '';
  qcmId = '';
  isLoading = false;
  isSubmitted = false;
  errorMessage = '';
  codeSnippet = '';

  constructor(
    private route: ActivatedRoute,
    private qcmService: QcmApiService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.qcmId = params['qcmId'];
      // Load existing QCM or initialize new one
    });
  }

  generateNewQcm() {
    if (!this.codeSnippet.trim()) {
      this.errorMessage = 'Veuillez entrer du code';
      return;
    }

    this.isLoading = true;
    this.qcmService.generateQcm(this.codeSnippet, 'angular-user')
      .subscribe({
        next: (response) => {
          this.questions = response.questions;
          this.answers = new Array(response.questions.length).fill('');
          this.qcmId = response.qcm_id;
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de la génération';
          this.isLoading = false;
        }
      });
  }

  selectAnswer(questionIndex: number, choiceIndex: string) {
    this.answers[questionIndex] = choiceIndex;
  }

  submitAnswers() {
    if (!this.studentName || this.answers.some(a => a === undefined)) {
      this.errorMessage = 'Veuillez compléter toutes les réponses et indiquer votre nom';
      return;
    }

    this.isLoading = true;
    this.qcmService.submitAnswers(this.qcmId, this.answers, this.studentName)
      .subscribe({
        next: () => {
          this.isSubmitted = true;
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de la soumission';
          this.isLoading = false;
        }
      });
  }
}
