import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QcmApiService } from './services/qcm-api.service';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `<router-outlet></router-outlet>`
})
export class AppComponent {
  constructor(private apiService: QcmApiService) {}
}
