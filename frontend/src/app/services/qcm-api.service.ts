import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface QcmItem {
  question: string;
  options: string[];
  correct_answer_index: number;
}

@Injectable({
  providedIn: 'root'
})
export class QcmApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Génère un QCM à partir du code (appel POST)
  generateQcm(codeBlock: string): Observable<{ qcm: QcmItem[], qcm_id: string }> {
    return this.http.post<{ qcm: QcmItem[], qcm_id: string }>(
      `${this.apiUrl}/generate_qcm`,
      { code_block: codeBlock }
    );
  }

  // Récupère le QCM déjà généré pour un auteur (appel GET)
  getQcm(author: string): Observable<{ qcm: QcmItem[], qcm_id: string }> {
    return this.http.get<{ qcm: QcmItem[], qcm_id: string }>(`${this.apiUrl}/get_qcm/${author}`);
  }

  // Soumet les réponses de l’utilisateur (appel POST)
  submitAnswers(author: string, qcm_id: string, answers: number[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/submit_answers`, {
      author, qcm_id, answers
    });
  }

  // Récupère les résultats (appel GET)
  getResults(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/results`);
  }
}
