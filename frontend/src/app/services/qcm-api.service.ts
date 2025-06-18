// src/app/services/qcm-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface QcmItem {
  question: string;
  choices: string[];
  answer: string;
}
export interface QcmResponse { qcm_id: string; qcm: QcmItem[]; }

@Injectable({ providedIn: 'root' })
export class QcmApiService {
  private url = 'http://localhost:5000';
  constructor(private http: HttpClient) {}

  getQcmsByAuthor(author:string): Observable<{ qcms: QcmResponse[] }> {
    return this.http.get<{ qcms: QcmResponse[] }>(`${this.url}/get_qcm/${author}`);
  }
  submitAnswers(author:string, qcmId:string, answers:string[]) {
    return this.http.post(`${this.url}/submit_answers`, { author, qcm_id:qcmId, answers });
  }
}
