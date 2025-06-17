// src/app/services/qcm-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface QcmItem {
  question: string;
  options: string[];
  correct_answer_index: number;  // tu peux l’ignorer côté étudiant
}

export interface QcmResponse {
  qcm_id: string;
  qcm: QcmItem[];
}

export interface QcmsList {
  qcms: QcmResponse[];
}

@Injectable({ providedIn: 'root' })
export class QcmApiService {
  private apiUrl = environment.apiUrl;
  private currentUser = 'github-action';

  constructor(private http: HttpClient) {}

  /** Récupère tous les QCM d'un auteur */
  getQcmsByAuthor(): Observable<QcmsList> {
    return this.http.get<QcmsList>(
      `${this.apiUrl}/get_qcm/${this.currentUser}`
    );
  }

  /** Soumet les réponses de l'utilisateur */
  submitAnswers(qcmId: string, answers: number[]) {
    return this.http.post(
      `${this.apiUrl}/submit_answers`,
      { author: this.currentUser, qcm_id: qcmId, answers }
    );
  }

  /** Génère le PDF professeur */
  generateTeacherPdf(qcmId: string) {
    return this.http.post<{ pdf_url: string }>(
      `${this.apiUrl}/generate_teacher_pdf`,
      { author: this.currentUser, qcm_id: qcmId }
    );
  }
}
