import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { InitiativesComponent } from './initiatives/initiatives.component';
import { AssignmentsComponent } from './assignments/assignments.component';
import { PeopleComponent } from './people/people.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { AccountComponent } from './account/account.component';
import { AdminComponent } from './admin/admin.component';
import { SyncComponent } from './sync/sync.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { AccountsComponent } from './accounts/accounts.component';
import { PlannerComponent } from './planner/planner.component';
import { FilteringPanelComponent } from './filter/filteringpanel.component';

import { AuthGuardLogin } from './services/auth-guard-login.service';
import { AuthGuardAdmin } from './services/auth-guard-admin.service';

const routes: Routes = [
  {
    path: '',
    component: FilteringPanelComponent,
    canActivate: [AuthGuardLogin],
    children: [
      {path: 'assignments', component: AssignmentsComponent},
      {path: 'accounts', component: AccountsComponent},
      {path: 'planner', component: PlannerComponent},
      {path: '', redirectTo: '/assignments', pathMatch: 'full'}
    ]
  },
  {path: 'register', component: RegisterComponent},
  {path: 'login', component: LoginComponent},
  {path: 'logout', component: LogoutComponent},
  {path: 'account', component: AccountComponent, canActivate: [AuthGuardLogin]},
  {path: 'admin', component: AdminComponent, canActivate: [AuthGuardAdmin]},
  {path: 'sync', component: SyncComponent, canActivate: [AuthGuardAdmin]},
  {path: '**', component: NotFoundComponent},
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})

export class RoutingModule {}
