import { Routes } from '@angular/router';
import { QcmFormComponent } from './qcm-form/qcm-form.component';

export const routes: Routes = [
  { path: 'qcm', component: QcmFormComponent },
  { path: '', redirectTo: '/qcm', pathMatch: 'full' }
];
