import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class QcmApiService {
  private apiUrl = 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  generateQcmFromCode(code: string, author: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/generate_qcm`, { code_block: code, author });
  }

  submitAnswers(qcmId: string, studentName: string, answers: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/submit_answers`, { qcm_id: qcmId, student_name: studentName, answers });
  }

  getAllResponses(): Observable<any> {
    return this.http.get(`${this.apiUrl}/all_responses`);
  }
}
