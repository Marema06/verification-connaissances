import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { QcmApiService } from '../services/qcm-api.service';
import { Chart, ChartConfiguration } from 'chart.js';
import { CommonModule } from '@angular/common';
import { jsPDF } from 'jspdf';
import Papa from 'papaparse';

@Component({
  selector: 'app-prof',
  templateUrl: './prof.component.html',
  styleUrls: ['./prof.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class ProfComponent implements AfterViewInit {
  @ViewChild('myChart') myChart!: ElementRef<HTMLCanvasElement>;
  chart!: Chart;

  allResponses: any[] = [];
  loading: boolean = false;

  constructor(private api: QcmApiService) {}

  ngAfterViewInit(): void {
    this.loadResponses();
  }

  loadResponses(): void {
    this.loading = true;
    this.api.getAllResponses().subscribe({
      next: (res) => {
        this.allResponses = res;
        this.loading = false;
        this.renderChart();
      },
      error: () => {
        alert("Erreur lors du chargement des réponses");
        this.loading = false;
      }
    });
  }

  getCorrectCount(questions: any[], answers: number[]): number {
    let correct = 0;
    for (let i = 0; i < questions.length; i++) {
      const correctIndex = ['A', 'B', 'C'].indexOf(questions[i].answer);
      if (answers[i] === correctIndex) correct++;
    }
    return correct;
  }

  renderChart() {
    const labels = this.allResponses.map(r => r.student_name);
    const scores = this.allResponses.map(r => this.getCorrectCount(r.questions, r.answers));

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Scores des élèves',
          data: scores,
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: Math.max(...scores) + 1
          }
        }
      }
    };

    if (this.chart) {
      this.chart.destroy();
    }
    this.chart = new Chart(this.myChart.nativeElement, config);
  }

  exportCSV(): void {
    const csvData = this.allResponses.map(r => {
      return {
        Nom: r.student_name,
        Score: this.getCorrectCount(r.questions, r.answers)
      };
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'scores.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportPDF(): void {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Scores des élèves', 14, 20);

    const rows = this.allResponses.map(r => [
      r.student_name,
      this.getCorrectCount(r.questions, r.answers).toString()
    ]);

    const startY = 30;
    rows.forEach((row, index) => {
      const y = startY + index * 10;
      doc.text(`${row[0]} : ${row[1]}`, 14, y);
    });

    doc.save('scores.pdf');
  }
}
