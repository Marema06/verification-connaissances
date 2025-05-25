import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QcmApiService } from '../services/qcm-api.service';

@Component({
  selector: 'app-qcm',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h1>Générateur de QCM</h1>
      <textarea
        [(ngModel)]="code"
        rows="10"
        cols="60"
        placeholder="Entrez votre code ici..."
      ></textarea>
      <br>
      <button (click)="sendCode()" [disabled]="isLoading">
        {{ isLoading ? 'Envoi en cours...' : 'Générer QCM' }}
      </button>

      @if (error) {
        <div class="error">{{ error }}</div>
      }

      @if (result) {
        <div class="result">
          <h2>Résultat :</h2>
          <pre>{{ result | json }}</pre>
        </div>
      }
    </div>
  `,
  styles: [`
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    textarea { width: 100%; margin-bottom: 10px; }
    .error { color: red; margin-top: 10px; }
    .result { margin-top: 20px; }
  `]
})
export class QcmComponent {
  code = `print("Hello, world!")`;
  result: any;
  error: string | null = null;
  isLoading = false;

  constructor(private qcmApi: QcmApiService) {}

  sendCode() {
    this.isLoading = true;
    this.error = null;

    this.qcmApi.generateQcm(this.code).subscribe({
      next: (res) => {
        this.result = res;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors de la génération du QCM';
        console.error(err);
        this.isLoading = false;
      }
    });
  }
}
