import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientModule } from '@angular/common/http';

import { RoutingModule } from './routing.module';
import { SharedModule } from './shared/shared.module';
import { MarkdownToHtmlModule } from 'markdown-to-html-pipe';
import { SocketIoModule, SocketIoConfig } from 'ng-socket-io';

import { AssignmentService } from './services/assignment.service';
import { ResourceService } from './services/resource.service';
import { InitiativeService } from './services/initiative.service';
import { DemandService } from './services/demand.service';
import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service';
import { SyncService } from './services/sync.service';
import { DpService } from './services/dp.service';
import { CommentService } from './services/comments.service';
import { DemandPlanService } from './services/demandplan.service';
import { AuthGuardLogin } from './services/auth-guard-login.service';
import { AuthGuardAdmin } from './services/auth-guard-admin.service';
import { BusService } from './services/bus.service';
import { FilterService } from './services/filter.service';
import { SocketService } from './services/socket.service';
import { SkillsService } from './services/skills.service';
import { RequisitionService } from './services/requisition.service';
import { CandidateService } from './services/candidate.service';

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
import { AccountsComponent } from './accounts/accounts.component';
import { DemandComponent } from './assignments/demand.component';
import { PrintableDatePipe, AvatarUrlPipe, RangePipe, KeysPipe, EllipsisPipe, CutIndexPipe } from './pipes';
import { FilterComponent } from './filter/filter.component';
import { FilteringPanelComponent } from './filter/filteringpanel.component';
import { PlannerComponent } from './planner/planner.component';
import { ReportComponent } from './planner/report.component';
import { CommentsComponent } from './planner/comments.component';
import { DemandPlanComponent } from './planner/demandplan.component';
import { DpComponent } from './deadpool/dp.component';
import { AvatarComponent } from './people/avatar.component';
import { AssignmentsReportComponent } from './assignments/report.component';
import { SkillsetComponent } from './planner/skillset.component';
import { CandidatesComponent } from './candidates/candidates.component';
import { RequisitionComponent } from './candidates/requisition.component';
import { SpinnerComponent } from './shared/spinner/spinner.component';

const config: SocketIoConfig = {
  url: ':3000',
  options: {}
};

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
    AssignmentComponent,
    AccountsComponent,
    DemandComponent,
    PrintableDatePipe, AvatarUrlPipe, RangePipe, KeysPipe, EllipsisPipe,
    FilterComponent, FilteringPanelComponent, CutIndexPipe,
    PlannerComponent, ReportComponent, CommentsComponent, DemandPlanComponent,
    RequisitionComponent,
    DpComponent,
    AvatarComponent,
    AssignmentsReportComponent,
    SkillsetComponent,
    CandidatesComponent,
    SpinnerComponent
  ],
  imports: [
    RoutingModule,
    HttpClientModule,
    SharedModule,
    MarkdownToHtmlModule,
    NgbModule.forRoot(),
    SocketIoModule.forRoot(config)
  ],
  providers: [
    AuthService,
    AuthGuardLogin,
    AuthGuardAdmin,
    ResourceService,
    InitiativeService,
    AssignmentService,
    UserService,
    SyncService,
    DemandService,
    BusService,
    FilterService,
    CommentService,
    DemandPlanService,
    DpService,
    SocketService,
    SkillsService,
    RequisitionService,
    CandidateService,
    PrintableDatePipe, AvatarUrlPipe
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent]
})

export class AppModule { }
