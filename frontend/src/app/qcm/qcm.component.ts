import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { QcmApiService, QcmItem } from '../services/qcm-api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-qcm',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './qcm.component.html',
})
export class QcmComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api   = inject(QcmApiService);

  qcmData: QcmItem[] = [];
  answers: string[] = [];
  feedback = '';
  isLoading = true;
  author!: string;
  qcmId!: string;

  ngOnInit() {
    this.author = this.route.snapshot.paramMap.get('author')!;
    this.qcmId  = this.route.snapshot.paramMap.get('qcmId')!;
    this.api.getQcmsByAuthor(this.author).subscribe({
      next: res => {
        const found = res.qcms.find(x => x.qcm_id === this.qcmId);
        if (found) {
          this.qcmData = found.qcm;
          this.answers = Array(this.qcmData.length).fill('');
        }
        this.isLoading = false;
      },
      error: _ => {
        this.feedback = 'Erreur chargement';
        this.isLoading = false;
      }
    });
  }

  submit() {
    if (this.answers.includes('')) {
      this.feedback = 'Merci de répondre à toutes les questions.';
      return;
    }
    this.api.submitAnswers(this.author, this.qcmId, this.answers)
      .subscribe(() => this.feedback = 'Réponses enregistrées !');
  }
}
