import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { QcmApiService } from '../services/qcm-api.service';

@Component({
  selector: 'app-qcm',
  templateUrl: './qcm.component.html',
  styleUrls: ['./qcm.component.css']
})
export class QcmComponent implements OnInit {
  questions: any[] = [];
  qcmId: string = '';

  constructor(
    private route: ActivatedRoute,
    private qcmApiService: QcmApiService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.qcmId = params.get('qcmId') || '';

      if (this.qcmId) {
        this.qcmApiService.getQcmForCommit(this.qcmId).subscribe({
          next: (data) => this.questions = data.questions || [],
          error: (err) => console.error('Erreur:', err)
        });
      }
    });
  }
}
