// src/app/components/qcm/qcm.component.ts
import { Component, OnInit } from '@angular/core';
import {QcmApiService} from '../services/qcm-api.service';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-qcm',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './qcm.component.html',
  styleUrls: ['./qcm.component.css']
})
export class QcmComponent implements OnInit {
  author = 'etudiant1'; // à adapter dynamiquement
  qcmList: any[] = [];
  userAnswers: number[][] = [];
  submitted = false;

  constructor(private qcmApi: QcmApiService) {}

  ngOnInit(): void {
    this.qcmApi.getQCMsByAuthor(this.author).subscribe((data) => {
      this.qcmList = data.qcms || [];
      this.userAnswers = this.qcmList.map(qcm =>
        qcm.questions.map(() => -1)
      );
    });
  }

  onSubmit(): void {
    this.submitted = true;
  }

  getScore(qcmIndex: number): number {
    const qcm = this.qcmList[qcmIndex];
    const answers = this.userAnswers[qcmIndex];
    let score = 0;
    qcm.questions.forEach((q: any, i: number) => {
      if (q.answer === answers[i]) score++;
    });
    return score;
  }
}
