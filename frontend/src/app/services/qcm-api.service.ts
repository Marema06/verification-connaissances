import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders }  from '@angular/common/http';
import { Observable }               from 'rxjs';
import { environment }              from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class QcmApiService {
  private http   = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private token  = environment.apiToken;

  generateQcm(code: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`,
      'Content-Type':  'application/json'
    });
    return this.http.post<any>(
      this.apiUrl,
      { code_block: code },
      { headers }
    );
  }
}
