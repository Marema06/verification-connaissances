import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface QcmItem {
  question: string;
  choices: string[];
  answer: string;
}

export interface QcmResponse {
  qcm_id: string;
  qcm: QcmItem[];
}

@Injectable({
  providedIn: 'root'
})
export class QcmApiService {
  private apiUrl = 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  // Récupère tous les QCM générés pour un auteur
  getQcmsByAuthor(author: string): Observable<{ qcms: QcmResponse[] }> {
    return this.http.get<{ qcms: QcmResponse[] }>(`${this.apiUrl}/get_qcm/${author}`);
  }

  // Soumet les réponses d’un étudiant
  submitAnswers(author: string, qcmId: string, answers: string[]): Observable<{ status: string; message: string }> {
    return this.http.post<{ status: string; message: string }>(`${this.apiUrl}/submit_answers`, {
      author,
      qcm_id: qcmId,
      answers
    });
  }

  // Génère un PDF pour les enseignants (optionnel)
  generateTeacherPdf(qcmId: string): Observable<{ pdf_url: string }> {
    return this.http.post<{ pdf_url: string }>(`${this.apiUrl}/generate_teacher_pdf`, {
      qcm_id: qcmId
    });
  }
}
