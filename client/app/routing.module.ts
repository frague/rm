import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { AssignmentsComponent } from './assignments/assignments.component';
import { ReportsComponent } from './reports/reports.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { AdminComponent } from './admin/admin.component';
import { SyncComponent } from './sync/sync.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { AccountsComponent } from './accounts/accounts.component';
import { PlannerComponent } from './planner/planner.component';
import { FilteringPanelComponent } from './filter/filteringpanel.component';
import { DpComponent } from './deadpool/dp.component';
import { CandidatesComponent } from './candidates/candidates.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { BadgesComponent } from './badges/badges.component';

import { AuthGuardLogin } from './services/auth-guard-login.service';
import { AuthGuardAdmin } from './services/auth-guard-admin.service';

const routes: Routes = [
  {
    path: '',
    component: FilteringPanelComponent,
    canActivate: [ AuthGuardLogin ],
    children: [
      { path: 'assignments', component: AssignmentsComponent },
      { path: 'accounts', component: AccountsComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'hiring', component: CandidatesComponent },
      { path: 'planner', component: PlannerComponent },
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
    ]
  },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'badges', component: BadgesComponent },
  { path: 'dp', component: DpComponent },
  { path: 'sync', component: SyncComponent, canActivate: [AuthGuardAdmin] },

  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'logout', component: LogoutComponent },
  { path: 'admin', component: AdminComponent, canActivate: [AuthGuardAdmin] },
  { path: '**', component: NotFoundComponent },
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})

export class RoutingModule {}
