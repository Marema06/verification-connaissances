import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface QcmItem {
  question: string;
  choices: string[];
  answer: string;
  explanation?: string;
}

export interface QcmResponse {
  qcm_id: string;
  questions: QcmItem[];
  pdf_url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class QcmApiService {
  private apiUrl = 'http://localhost:5000';

  constructor(private http: HttpClient) { }

  generateQcm(code: string, author: string): Observable<QcmResponse> {
    return this.http.post<QcmResponse>(`${this.apiUrl}/generate_qcm`, {
      code_block: code,
      author: author
    });
  }

  submitAnswers(qcmId: string, answers: string[], studentName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/submit_answers`, {
      qcm_id: qcmId,
      answers: answers,
      student_name: studentName
    });
  }

  getQcmPdfUrl(qcmId: string, author: string): string {
    return `${this.apiUrl}/qcms/${author}/student_${qcmId}.pdf`;
  }
}
