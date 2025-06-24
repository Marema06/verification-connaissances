// src/app/services/qcm-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QcmApiService {
  private apiUrl = 'http://localhost:5000/get_qcm'; // à adapter si besoin

  constructor(private http: HttpClient) {}

  getQCMsByAuthor(author: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${author}`);
  }
}
