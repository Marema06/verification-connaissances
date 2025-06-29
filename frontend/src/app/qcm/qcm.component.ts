import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QcmApiService } from '../services/qcm-api.service';

@Component({
  selector: 'app-qcm',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './qcm.component.html',
  styleUrls: ['./qcm.component.css']
})
export class QcmComponent {
  codeInput: string = '';
  isGenerating: boolean = false;
  qcmGenerated: boolean = false;
  timer: number = 0;
  progress: number = 0;

  qcmId: string = '';
  questions: any[] = [];

  answers: { question: any; selected: number | null }[] = [];
  feedback: string[] = [];

  submitted: boolean = false;
  score: number = 0;

  constructor(private api: QcmApiService) {}

  generateQcm(): void {
    if (!this.codeInput.trim()) {
      alert('Veuillez coller votre code avant de générer le QCM.');
      return;
    }

    this.isGenerating = true;
    this.qcmGenerated = false;
    this.timer = 0;
    this.progress = 0;
    this.submitted = false;

    this.api.generateQcmFromCode(this.codeInput, 'student1').subscribe({
      next: (res) => {
        this.qcmId = res.qcm_id;
        this.questions = res.questions;
        this.answers = this.questions.map(q => ({ question: q, selected: null }));
        this.feedback = new Array(this.questions.length).fill('');
        this.isGenerating = false;
        this.qcmGenerated = true;
      },
      error: (err) => {
        console.error('Erreur de génération de QCM', err);
        this.isGenerating = false;
      }
    });
  }

  selectAnswer(questionIndex: number, optionIndex: number): void {
    if (this.submitted) return;
    this.answers[questionIndex].selected = optionIndex;
    const correct = this.questions[questionIndex].answer;
    const correctIndex = ['A', 'B', 'C'].indexOf(correct);
    this.feedback[questionIndex] = optionIndex === correctIndex ? 'Bonne réponse ✅' : 'Mauvaise réponse ❌';
  }

  submitAnswers(): void {
    const allAnswered = this.answers.every(a => a.selected !== null);
    if (!allAnswered) {
      alert('Veuillez répondre à toutes les questions avant de soumettre.');
      return;
    }

    this.submitted = true;
    this.score = this.answers.reduce((total, answer, i) => {
      const correctIndex = ['A', 'B', 'C'].indexOf(this.questions[i].answer);
      return total + (answer.selected === correctIndex ? 1 : 0);
    }, 0);

    const selectedIndexes = this.answers.map(a => a.selected ?? -1);
    this.api.submitAnswers(this.qcmId, 'student1', selectedIndexes).subscribe({
      next: () => alert('Réponses soumises avec succès ✅'),
      error: (err) => {
        console.error('Erreur de soumission', err);
        alert('Erreur lors de la soumission ❌');
      }
    });
  }
}
