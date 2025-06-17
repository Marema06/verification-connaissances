import { Routes } from '@angular/router';
import { QcmComponent } from './qcm/qcm.component';
import { HttpClient } from '@angular/common/http';

export const routes: Routes = [
  { path: '', redirectTo: 'qcm/anonymous/sample-qcm', pathMatch: 'full' },
  { path: 'qcm', redirectTo: 'qcm/anonymous/sample-qcm', pathMatch: 'full' },
  { path: 'qcm/:author/:qcmId', component: QcmComponent },
];
