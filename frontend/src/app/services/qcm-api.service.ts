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

  generateQcm(codeBlock: string): Observable<{ qcm: QcmItem[], qcm_id: string }> {
    return this.http.post<{ qcm: QcmItem[], qcm_id: string }>(
      `${this.apiUrl}/generate_qcm`,
      { code_block: codeBlock }
    );
  }

  getQcm(author: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/get_qcm/${author}`);
  }

  submitAnswers(author: string, qcm_id: string, answers: number[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/submit_answers`, {
      author, qcm_id, answers
    });
  }

  getResults(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/results`);
  }
}
