import { Component, ViewChild, ElementRef } from '@angular/core';
import { Schedule } from '../schedule';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';


import { ReportComponent } from './report.component';
import { CommentsComponent } from './comments.component';
import { DemandPlanComponent } from './demandplan.component';

import { AssignmentService } from '../services/assignment.service';
import { InitiativeService } from '../services/initiative.service';
import { ResourceService } from '../services/resource.service';
import { DemandService } from '../services/demand.service';
import { BusService } from '../services/bus.service';

@Component({
	selector: 'planner',
  templateUrl: './planner.component.html'
})
export class PlannerComponent extends Schedule {
  @ViewChild(ReportComponent) reportModal: ReportComponent;
  @ViewChild(CommentsComponent) commentsModal: CommentsComponent;
  @ViewChild(DemandPlanComponent) demandPlan: CommentsComponent;
  @ViewChild('sticky') boardOfFame: ElementRef;
  bofOffset: any = 'auto';

  get cardWidth() {return 120};

  candidates = [];
  candidatesCount = 0;

  reserved = {};
  deserved = {};

  accountsDemand = {};

  postFetch = () => {
    this.accountsDemand = {};

    this.candidates = this.items
      .filter(item => !item.isDemand)
      .slice(0, 16)
      .map(item => {
        let result = this.resourcesById[item._id] || {};
        ['canTravel', 'billable'].forEach(key => result[key] = item[key] === 'true');
        return result;
      });
    this.candidatesCount = this.candidates.length;
    let demands = this.items
      .filter(item => item.isDemand)
      .map(item => {
        let assignments = item.assignments;
        return assignments[Object.keys(assignments)[0]][0].demand;
      });
    demands.forEach(demand => {
      let account = demand.account;
      if (!this.accountsDemand[account]) {
        this.accountsDemand[account] = [];
      }
      this.accountsDemand[account].push(demand);
    });
  };

  constructor(
    assignmentService: AssignmentService,
    resourceService: ResourceService,
    initiativeService: InitiativeService,
    demandService: DemandService,
    bus: BusService
  ) {
    super(assignmentService, resourceService, initiativeService, demandService, bus);
  }

  ngOnInit() {
    super.ngOnInit();
    window.addEventListener('scroll', this.scroll, true);
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    window.removeEventListener('scroll', this.scroll, true);
  }

  scroll = (event: Event) => {
    if (this.boardOfFame && this.boardOfFame.nativeElement) {
      let windowOffset = window.pageYOffset;
      let element = this.boardOfFame.nativeElement;
      let offset = element.offsetParent.offsetTop;
      let cardsHeight = element.clientHeight;
      if (windowOffset > offset) {
        this.bofOffset = (windowOffset - offset + cardsHeight) + 'px';
        return;
      }
    }
    this.bofOffset = 'auto';
  };

  getAccounts() {
    return Object.keys(this.accountsDemand).sort();
  }

  getCandidates() {
    return this.candidates;
  }

  makeCaption(demand) {
    return demand.name;
  }

  showResource(resource: any, isDemand=false) {
    if (isDemand) {
      return this.demandModal.show(resource);
    } else {
      return this.personModal.show(this.resourcesById[resource._id])
    }
  }

  showReport() {
    this.reportModal.show(this.reserved);
  }

  showComments(candidate, event: MouseEvent) {
    event.stopPropagation();
    this.commentsModal.show(candidate);
  }

  reserve(candidate: any, demand: any) {
    let demandRow = this.deserved[candidate.login];
    let candidateId = this.reserved[demand.row];
    if (demandRow) {
      this.reserved[demandRow] = '';
    }
    if (candidateId) {
      this.deserved[candidateId] = '';
    }
    if (candidate.login != candidateId) {
      this.reserved[demand.row] = candidate.login;
      this.deserved[candidate.login] = demand.row;
    }
  }

  setReservations(data: {rows: string[], logins: string[]}) {
    this.reserved = {};
    this.deserved = {};
    data.rows.forEach((row, index) => {
      let login = data.logins[index];
      this.reserved[row] = login;
      this.deserved[login] = row;
    });
  }

  getReservation(candidate: any, demand: any) {
    return this.reserved[demand.row] === candidate.login;
  }

  getDemandAttrs(demand) {
    return (demand.grades || []).join(', ') + ' (' + (demand.locations || []).join(', ') + ')';
  }

  isAssigned(candidate: any) {
    return Object.values(this.reserved).indexOf(candidate.login) >= 0;
  }

  isOnsite(demand) {
    return demand.deployment.toLowerCase().indexOf('onsite') >= 0;
  }
}