import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {QcmApiService} from '../services/qcm-api.service';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-qcm',
  imports: [
    FormsModule,
    CommonModule
  ],
  templateUrl: './qcm.component.html'
})
export class QcmComponent implements OnInit {
  questions: any[] = [];
  answers: any = {};
  commitId: string = '';

  constructor(
    private route: ActivatedRoute,
    private qcmApiService: QcmApiService
  ) {}

  ngOnInit() {
    this.commitId = this.route.snapshot.params['commitId'];
    this.qcmApiService.getQcmForCommit(this.commitId).subscribe({
      next: (data) => this.questions = data.questions,
      error: () => alert('Erreur de chargement')
    });
  }

  submit() {
    this.qcmApiService.submitAnswers(this.commitId, this.answers)
      .subscribe(() => alert('Réponses enregistrées!'));
  }
}
