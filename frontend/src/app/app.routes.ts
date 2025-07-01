import { Routes } from '@angular/router';
import { QcmComponent } from './qcm/qcm.component';
import { ProfComponent } from './prof/prof.component';

export const routes: Routes = [
  { path: '', redirectTo: 'qcm', pathMatch: 'full' },
  { path: 'qcm', component: QcmComponent },
  { path: 'qcm/:qcmId', component: QcmComponent },
  { path: 'qcm/:author/:qcmId', component: QcmComponent, data: { prerender: false } },
  { path: 'prof', component: ProfComponent }
];
