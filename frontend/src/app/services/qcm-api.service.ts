import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QcmApiService {
  private apiUrl = 'http://localhost:5000';

  constructor(private http: HttpClient) { }

  getQcm(qcmId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/qcm/${qcmId}`);
  }

  submitAnswers(qcmId: string, answers: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/submit`, {
      qcm_id: qcmId,
      answers: answers
    });
  }
}
