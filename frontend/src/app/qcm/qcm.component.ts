import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { QcmApiService, QcmItem } from '../services/qcm-api.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-qcm',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './qcm.component.html',
  styleUrls: ['./qcm.component.css']
})
export class QcmComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(QcmApiService);

  author!: string;
  qcmId!: string;

  qcmData: QcmItem[] = [];
  answers: string[] = [];
  feedback = '';
  pdfUrl: string| null = null;
  isLoading = true;

  ngOnInit() {
    this.author = this.route.snapshot.paramMap.get('author')!;
    this.qcmId  = this.route.snapshot.paramMap.get('qcmId')!;

    this.api.getQcmsByAuthor(this.author).subscribe({
      next: res => {
        const hit = res.qcms.find(q => q.qcm_id === this.qcmId);
        if (hit) {
          this.qcmData = hit.qcm;
          this.answers = new Array(this.qcmData.length).fill('');
        }
        this.isLoading = false;
      },
      error: _ => {
        this.feedback = 'Erreur de chargement';
        this.isLoading = false;
      }
    });
  }

  submit() {
    if (this.answers.includes('')) {
      this.feedback = 'Répondez à toutes les questions.';
      return;
    }
    this.api.submitAnswers(this.author, this.qcmId, this.answers)
      .subscribe(() => this.feedback = 'Réponses envoyées !');
  }

  downloadPdf() {
    this.api.generateTeacherPdf(this.qcmId)
      .subscribe(r => this.pdfUrl = r.pdf_url);
  }
}
