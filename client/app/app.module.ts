import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientModule } from '@angular/common/http';
import { JwtModule } from '@auth0/angular-jwt';

import { RoutingModule } from './routing.module';
import { SharedModule } from './shared/shared.module';
import { ChartsModule } from '@rinminase/ng-charts';

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
import { SocketIOService } from './services/socket.service';
import { SkillsService } from './services/skills.service';
import { InGridService } from './services/ingrid.service';
import { RequisitionService } from './services/requisition.service';
import { CandidateService } from './services/candidate.service';
import { CareerService } from './services/career.service';
import { RequisitionDemandService } from './services/requisitionDemand.service';
import { CacheService } from './services/cache.service';
import { ItemBadgeService } from './services/itemBadge.service';
import { BadgeService } from './services/badge.service';
import { LoaderService } from './services/loader.service';

import { AppComponent } from './app.component';
import { SyncComponent } from './sync/sync.component';
import { TaskComponent } from './sync/task.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { RequisitionDemandComponent } from './candidates/requisition-demand.component';
import { InitiativeComponent } from './initiatives/initiative.component';
import { AssignmentsComponent } from './assignments/assignments.component';
import { ReportsComponent } from './reports/reports.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { AccountComponent } from './account/account.component';
import { AdminComponent } from './admin/admin.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { AccountsComponent } from './accounts/accounts.component';
import { PrintableDatePipe, RangePipe, KeysPipe, EllipsisPipe, CutIndexPipe, ColumnPipe, MarkdownPipe,
    SplitPipe, DeCamelPipe, CutByPipe, DiffPipe } from './pipes';
import { FilterComponent } from './filter/filter.component';
import { FilteringPanelComponent } from './filter/filteringpanel.component';
import { PlannerComponent } from './planner/planner.component';
import { ReportComponent } from './planner/report.component';
import { DemandPlanComponent } from './planner/demandplan.component';
import { DpComponent } from './deadpool/dp.component';
import { AvatarComponent } from './reports/avatar.component';
import { AssignmentsReportComponent } from './assignments/report.component';
import { SkillsetComponent } from './planner/skillset.component';
import { CandidatesComponent } from './candidates/candidates.component';
import { EditorComponent } from './shared/editor/editor.component';
import { SpinnerComponent } from './shared/spinner/spinner.component';
import { CommentComponent } from './shared/comment/comment.component';
import { BadgerComponent } from './shared/badger/badger.component';
import { PrintableComponent } from './shared/printable/printable.component';

import { BadgesComponent } from './badges/badges.component';
import { DemandInfo } from './planner/demandinfo.component';

import { PersonModal } from './modal/person-modal.component';
import { AssignmentModal } from './modal/assignment-modal.component';
import { DemandModal } from './modal/demand-modal.component';
import { RequisitionModal } from './modal/requisition-modal.component';
import { CommentsModal } from './modal/comments-modal.component';
import { CandidateModal } from './modal/candidate-modal.component';

import { UserTabComponent } from './modal/tabs/user-tab.component';
import { CommentsTabComponent } from './modal/tabs/comments-tab.component';
import { SkillsTabComponent } from './modal/tabs/skills-tab.component';
import { CareerTabComponent } from './modal/tabs/career-tab.component';
import { AssignmentTabComponent } from './modal/tabs/assignment-tab.component';
import { AssignmentsTabComponent } from './modal/tabs/assignments-tab.component';
import { HistoryTabComponent } from './modal/tabs/history-tab.component';
import { DemandTabComponent } from './modal/tabs/demand-tab.component';
import { RequisitionTabComponent } from './modal/tabs/requisition-tab.component';
import { CandidatesTabComponent } from './modal/tabs/candidates-tab.component';
import { CandidateTabComponent } from './modal/tabs/candidate-tab.component';
import { DemandRequisitionTabComponent } from './modal/tabs/demand-requisition-tab.component';
import { AccountProjectTabComponent } from './modal/tabs/account-project-tab.component';
import { FeedbacksTabComponent } from './modal/tabs/feedbacks-tab.component';

import { QueryWidget } from './dashboard/query.widget';
import { BirthdaysWidget } from './dashboard/birthdays.widget';
import { CommentsWidget } from './dashboard/comments.widget';

export function tokenGetter() {
  return localStorage.getItem('token');
}

@NgModule({
  declarations: [
    AppComponent,
    InitiativeComponent,
    AssignmentsComponent,
    ReportsComponent,
    RegisterComponent,
    LoginComponent,
    LogoutComponent,
    AccountComponent,
    AdminComponent,
    NotFoundComponent,
    SyncComponent, TaskComponent,
    BadgesComponent,
    AccountsComponent,
    PrintableDatePipe, RangePipe, KeysPipe, EllipsisPipe, MarkdownPipe,
    FilterComponent, FilteringPanelComponent, CutIndexPipe, ColumnPipe,
    SplitPipe, DeCamelPipe, CutByPipe, DiffPipe,

    PlannerComponent, ReportComponent, DemandPlanComponent,
    DpComponent,
    AvatarComponent,
    AssignmentsReportComponent,
    SkillsetComponent,
    CandidatesComponent,
    EditorComponent,
    SpinnerComponent,
    RequisitionDemandComponent,
    DashboardComponent,

    PersonModal, AssignmentModal, DemandModal, RequisitionModal, CommentsModal, CandidateModal,

    UserTabComponent, CommentsTabComponent, SkillsTabComponent, CareerTabComponent,
    AssignmentTabComponent, AssignmentsTabComponent, HistoryTabComponent, DemandTabComponent,
    RequisitionTabComponent, CandidatesTabComponent, CandidateTabComponent,
    DemandRequisitionTabComponent, AccountProjectTabComponent, FeedbacksTabComponent, CommentComponent,
    BadgerComponent, DemandInfo, PrintableComponent,

    QueryWidget, BirthdaysWidget, CommentsWidget,
  ],
  imports: [
    RoutingModule,
    HttpClientModule,
    ChartsModule,
    SharedModule,
    NgbModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: tokenGetter,
        whitelistedDomains: ['localhost:3030'],
        blacklistedRoutes: []
      }
    })
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
    SocketIOService,
    SkillsService,
    InGridService,
    RequisitionService,
    CandidateService,
    CareerService,
    RequisitionDemandService,
    CacheService,
    ItemBadgeService,
    BadgeService,
    LoaderService,

    PrintableDatePipe,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent]
})
export class AppModule { }
