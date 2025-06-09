import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
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

  setCurrentUser(author: string) {
    this.currentUser = author;
  }

  getQcmsByAuthor(author: string): Observable<QcmsList> {
    const url = `${this.apiUrl}/get_qcm/${author}`;
    return this.http.get<QcmsList>(url).pipe(
      tap(() => console.log(`GET QCMs for author: ${author}`)),
      catchError(err => {
        console.error('Erreur getQcmsByAuthor :', err);
        return throwError(() => err);
      })
    );
  }

  submitAnswers(author: string, qcmId: string, answers: number[]): Observable<any> {
    const payload = { author, qcm_id: qcmId, answers };
    return this.http.post<any>(`${this.apiUrl}/submit_answers`, payload).pipe(
      tap(() => console.log(`POST answers for QCM ${qcmId}`)),
      catchError(err => {
        console.error('Erreur submitAnswers :', err);
        return throwError(() => err);
      })
    );
  }

  generateTeacherPdf(qcmId: string): Observable<{ pdf_url: string }> {
    const payload = { author: this.currentUser, qcm_id: qcmId };
    return this.http.post<{ pdf_url: string }>(`${this.apiUrl}/generate_teacher_pdf`, payload).pipe(
      tap(() => console.log(`POST generateTeacherPdf for QCM ${qcmId}`)),
      catchError(err => {
        console.error('Erreur generateTeacherPdf :', err);
        return throwError(() => err);
      })
    );
  }
}
