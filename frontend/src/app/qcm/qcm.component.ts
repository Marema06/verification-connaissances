import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { QcmApiService, QcmResponse } from '../services/qcm-api.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-qcm',
  standalone: true,
  imports: [CommonModule, HttpClientModule, ReactiveFormsModule],
  templateUrl: './qcm.component.html',
  styleUrls: ['./qcm.component.css']
})
export class QcmComponent implements OnInit {
  qcms: QcmResponse[] = [];
  forms: FormGroup[] = [];
  pdfUrl: string | null = null;
  author = 'github-action';

  constructor(private qcmService: QcmApiService, private fb: FormBuilder) {}

  ngOnInit() {
    this.qcmService.getQcmsByAuthor(this.author).subscribe({
      next: res => {
        this.qcms = res.qcms;
        this.qcms.forEach((qcm, idx) => {
          const group: any = {};
          qcm.qcm.forEach((_, i) => group['q' + i] = ['', Validators.required]);
          this.forms[idx] = this.fb.group(group);
        });
      },
      error: err => console.error('Erreur getQcms', err)
    });
  }

  submit(idx: number) {
    const form = this.forms[idx];
    if (form.invalid) return;
    const answers = this.qcms[idx].qcm.map((_, i) => form.value['q' + i]);
    this.qcmService.submitAnswers(this.author, this.qcms[idx].qcm_id, answers).subscribe();
  }

  downloadPdf(idx: number) {
    this.qcmService.generateTeacherPdf(this.qcms[idx].qcm_id)
      .subscribe(res => this.pdfUrl = res.pdf_url);
  }
}
