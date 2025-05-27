import { Routes } from '@angular/router';
import { QcmComponent } from './qcm/qcm.component';
import { HttpClient } from '@angular/common/http';
import {DashboardComponent} from './dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: 'qcm', pathMatch: 'full' },
  { path: 'qcm', component: QcmComponent },
  { path: 'dashboard', component: DashboardComponent }

];
