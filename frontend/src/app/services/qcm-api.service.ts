import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface QcmItem {
  question: string;
  options: string[];
  correct_answer_index: number;
}

export interface QcmResponse {
  author: string;
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

  /** Récupère tous les QCM générés pour un auteur */
  getQcmsByAuthor(author: string): Observable<QcmsList> {
    return this.http
      .get<QcmsList>(`${this.apiUrl}/get_qcm/${author}`)
      .pipe(catchError(err => { console.error('Erreur getQcmsByAuthor', err); throw err; }));
  }

  /** Soumet les réponses de l’utilisateur */
  submitAnswers(author: string, qcmId: string, answers: number[]) {
    return this.http.post(
      `${this.apiUrl}/submit_answers`,
      { author, qcm_id: qcmId, answers }
    ).pipe(catchError(err => { console.error('Erreur submitAnswers', err); throw err; }));
  }

  /** Génère le PDF prof pour un QCM */
  generateTeacherPdf(qcmId: string): Observable<{ pdf_url: string }> {
    return this.http.post<{ pdf_url: string }>(
      `${this.apiUrl}/generate_teacher_pdf`,
      { author: this.currentUser, qcm_id: qcmId }
    ).pipe(catchError(err => { console.error('Erreur generateTeacherPdf', err); throw err; }));
  }
}
