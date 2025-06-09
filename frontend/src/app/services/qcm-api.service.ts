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
  qcm: QcmItem[];
  qcm_id: string;
}

@Injectable({
  providedIn: 'root'
})
export class QcmApiService {
  apiUrl = environment.apiUrl;
  private currentUser = 'github-action'; // ou récupérer dynamiquement

  constructor(private http: HttpClient) {}

  /** Génère un QCM à partir d'un bloc de code */
  generateQcm(codeBlock: string): Observable<{ qcm_id: string; url: string }> {
    return this.http.post<{ qcm_id: string; url: string }>(
      `${this.apiUrl}/generate_qcm`,
      { code_block: codeBlock, author: this.currentUser }
    ).pipe(
      catchError(err => {
        console.error('Erreur generateQcm', err);
        throw err;
      })
    );
  }

  /** Récupère le dernier QCM généré pour un auteur */
  getQcmByAuthor(author: string): Observable<QcmResponse> {
    return this.http.get<QcmResponse>(`${this.apiUrl}/get_qcm/${author}`).pipe(
      catchError(err => {
        console.error('Erreur getQcmByAuthor', err);
        throw err;
      })
    );
  }

  /** Soumet les réponses de l'utilisateur pour un QCM donné */
  submitAnswers(author: string, qcmId: string, answers: number[]): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/submit_answers`,
      { author, qcm_id: qcmId, answers }
    ).pipe(
      catchError(err => {
        console.error('Erreur submitAnswers', err);
        throw err;
      })
    );
  }

  /** Génère et récupère l'URL du PDF professeur pour un QCM */
  generateTeacherPdf(qcmId: string): Observable<{ pdf_url: string }> {
    return this.http.post<{ pdf_url: string }>(
      `${this.apiUrl}/generate_teacher_pdf`,
      { qcm_id: qcmId, author: this.currentUser }
    ).pipe(
      catchError(err => {
        console.error('Erreur generateTeacherPdf', err);
        throw err;
      })
    );
  }
}
