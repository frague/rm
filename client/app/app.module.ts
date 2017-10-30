import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { RoutingModule } from './routing.module';
import { SharedModule } from './shared/shared.module';
import { AssignmentService } from './services/assignment.service';
import { ResourceService } from './services/resource.service';
import { InitiativeService } from './services/initiative.service';
import { PmoService } from './services/pmo.service';
import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service';
import { BambooService } from './services/bamboo.service';
import { AuthGuardLogin } from './services/auth-guard-login.service';
import { AuthGuardAdmin } from './services/auth-guard-admin.service';
import { AppComponent } from './app.component';
import { SyncComponent } from './sync/sync.component';
import { InitiativesComponent } from './initiatives/initiatives.component';
import { InitiativeComponent } from './initiatives/initiative.component';
import { AssignmentsComponent } from './assignments/assignments.component';
import { PeopleComponent } from './people/people.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { AccountComponent } from './account/account.component';
import { AdminComponent } from './admin/admin.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { PersonComponent } from './people/person.component';
import { AssignmentComponent } from './assignments/assignment.component';

@NgModule({
  declarations: [
    AppComponent,
    InitiativesComponent,
    InitiativeComponent,
    AssignmentsComponent,
    PeopleComponent,
    RegisterComponent,
    LoginComponent,
    LogoutComponent,
    AccountComponent,
    AdminComponent,
    NotFoundComponent,
    SyncComponent,
    PersonComponent,
    AssignmentComponent
  ],
  imports: [
    RoutingModule,
    SharedModule,
    NgbModule.forRoot()
  ],
  providers: [
    AuthService,
    AuthGuardLogin,
    AuthGuardAdmin,
    ResourceService,
    InitiativeService,
    AssignmentService,
    UserService,
    PmoService,
    BambooService
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent]
})

export class AppModule { }
