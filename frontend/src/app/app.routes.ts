import { Routes } from '@angular/router';
import { QcmComponent } from './qcm/qcm.component';
import { HttpClient } from '@angular/common/http';

export const routes: Routes = [
  { path: '', redirectTo: 'qcm', pathMatch: 'full' },
  { path: 'qcm', component: QcmComponent }
];
