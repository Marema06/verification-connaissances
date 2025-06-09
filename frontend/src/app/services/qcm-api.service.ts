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

  getQcmsByAuthor(author: string): Observable<QcmsList> {
    return this.http
      .get<QcmsList>(`${this.apiUrl}/get_qcm/${author}`)
      .pipe(catchError(err => { console.error(err); throw err; }));
  }

  submitAnswers(author: string, qcmId: string, answers: number[]) {
    return this.http.post(`${this.apiUrl}/submit_answers`, { author, qcm_id: qcmId, answers });
  }

  generateTeacherPdf(qcmId: string) {
    return this.http.post<{ pdf_url: string }>(
      `${this.apiUrl}/generate_teacher_pdf`,
      { author: this.currentUser, qcm_id: qcmId }
    );
  }
}
