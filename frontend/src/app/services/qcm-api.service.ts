import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QcmApiService {
  private apiUrl = 'http://localhost:5000';

  constructor(private http: HttpClient) { }

  getQcmForCommit(commitId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/qcm/${commitId}`);
  }

  submitAnswers(commitId: string, answers: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/submit`, {
      commit_id: commitId,
      answers: answers
    });
  }
}
