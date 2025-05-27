import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QcmApiService } from '../services/qcm-api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  results: any[] = [];
  error = '';
  loading = false;

  constructor(private qcmApiService: QcmApiService) {}

  ngOnInit(): void {
    this.fetchResults();
  }

  fetchResults(): void {
    this.loading = true;
    this.error = '';
    this.qcmApiService.getResults().subscribe({
      next: (res) => {
        this.results = res;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des résultats';
        this.loading = false;
      }
    });
  }
}
