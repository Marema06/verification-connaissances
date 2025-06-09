import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { QcmApiService, QcmResponse } from '../services/qcm-api.service';

@Component({
  selector: 'app-qcm',
  templateUrl: './qcm.component.html',
  imports: [
    ReactiveFormsModule
  ],
  styleUrls: ['./qcm.component.css']
})
export class QcmComponent implements OnInit {
  qcmForm!: FormGroup;
  qcmData!: QcmResponse;
  pdfUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private qcmService: QcmApiService
  ) {}

  ngOnInit() {
    this.qcmService.getQcmByAuthor('github-action').subscribe(res => {
      this.qcmData = res;
      const controls: any = {};
      res.qcm.forEach((_, i) => controls[`q${i}`] = ['', Validators.required]);
      this.qcmForm = this.fb.group(controls);
    });
  }

  submitAnswers() {
    if (this.qcmForm.invalid) return;
    const answers = this.qcmData.qcm.map((_, i) => this.qcmForm.value[`q${i}`]);
    this.qcmService.submitAnswers(this.qcmData.author, this.qcmData.qcm_id, answers)
      .subscribe();
  }

  downloadTeacherPdf() {
    this.qcmService.generateTeacherPdf(this.qcmData.qcm_id)
      .subscribe(res => this.pdfUrl = this.qcmService.apiUrl + res.pdf_url);
  }
}
