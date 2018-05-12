import { Component, ViewChild, ElementRef } from '@angular/core';
import { Schedule } from '../schedule';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';


import { ReportComponent } from './report.component';
import { CommentsComponent } from './comments.component';
import { DemandPlanComponent } from './demandplan.component';
import { RequisitionComponent } from '../candidates/requisition.component';

import { AssignmentService } from '../services/assignment.service';
import { InitiativeService } from '../services/initiative.service';
import { ResourceService } from '../services/resource.service';
import { DemandService } from '../services/demand.service';
import { CandidateService } from '../services/candidate.service';
import { BusService } from '../services/bus.service';

const stripIndex = new RegExp(/^\d{2} /);
const rowNumber = new RegExp(/^(\d+):/);

@Component({
	selector: 'planner',
  templateUrl: './planner.component.html'
})
export class PlannerComponent extends Schedule {
  @ViewChild(ReportComponent) reportModal: ReportComponent;
  @ViewChild(CommentsComponent) commentsModal: CommentsComponent;
  @ViewChild(DemandPlanComponent) demandPlan: DemandPlanComponent;
  @ViewChild(RequisitionComponent) requisitionModal: RequisitionComponent;
  @ViewChild('sticky') boardOfFame: ElementRef;
  bofOffset: any = 'auto';

  get cardWidth() {return 120};

  candidates = [];
  candidatesCount = 0;

  hirees = [];

  reserved = {};
  deserved = {};

  accountsDemand = {};

  postFetch = query => {
    this.accountsDemand = {};
    let queryString = JSON.stringify(query);
    let candidatesQuery = queryString.indexOf('candidate.') >= 0 || queryString.indexOf('comments.') >= 0 ?
      this.candidateService.getAll(query) : Observable.from([[]]);

    candidatesQuery.subscribe(data => {
      this.hirees = data;

      this.candidates = Object.keys(query).length
        ?
          this.items
            .slice(0, 100)
            .filter(item => !item.isDemand)
            .sort((a, b) => {
              let [aChosen, bChosen] = [this.deserved[a.login], this.deserved[b.login]];
              if (aChosen && !bChosen) return -1
              else if (!aChosen && bChosen) return 1;
              return a.name < b.name ? -1 : 1;
            })
            .slice(0, 30)
            .map(item => {
              let result = this.resourcesById[item._id] || {};
              ['canTravel', 'billable'].forEach(key => result[key] = item[key] === 'true');
              return result;
            })
        :
          [];

      this.hirees.slice(0, 20).forEach(hiree => {
        hiree.isHiree = true;
        this.candidates.push(hiree)
      });

      this.candidatesCount = this.candidates.length;

      let demands = this.items
        .filter(item => item.isDemand)
        .map(item => {
          let assignments = item.assignments;
          item.login = assignments[Object.keys(assignments)[0]][0].demand.login;
          return item;
        })
        .sort((a, b) => a.login < b.login ? -1 : 1)
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
    });

  };

  constructor(
    assignmentService: AssignmentService,
    resourceService: ResourceService,
    initiativeService: InitiativeService,
    demandService: DemandService,
    private candidateService: CandidateService,
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
    } else if (!resource.isHiree) {
      return this.personModal.show(this.resourcesById[resource._id])
    }
  }

  showReport() {
    this.reportModal.show(this.reserved);
  }

  showRequisition(requisitionId: string, e: MouseEvent) {
    e.cancelBubble = true;
    this.requisitionModal.show(requisitionId);
  }

  showComments(candidate, event: MouseEvent) {
    event.stopPropagation();
    this.commentsModal.show(candidate);
  }

  reserve(candidate: any, demand: any) {
    let demandRow = this.deserved[candidate.login];
    let candidateId = this.reserved[demand.login];
    if (demandRow) {
      this.reserved[demandRow] = '';
    }
    if (candidateId) {
      this.deserved[candidateId] = '';
    }
    if (candidate.login != candidateId) {
      this.reserved[demand.login] = candidate.login;
      this.deserved[candidate.login] = demand.login;
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
    return this.reserved[demand.login] === candidate.login;
  }

  getDemandCandidate(demand: any) {
    return this.reserved[demand.login];
  }

  getDemandAttrs(demand) {
    return (demand.grades || '') + ' (' + (demand.locations || '') + ')';
  }

  isAssigned(candidate: any) {
    return Object.values(this.reserved).indexOf(candidate.login) >= 0;
  }

  isOnsite(demand) {
    return demand.deployment.toLowerCase().indexOf('onsite') >= 0;
  }

  getCandidateCaption(candidate): string {
    if (candidate.isHiree) {
      return candidate.state.replace(stripIndex, '');
    } else {
      return candidate.grade + ', ' + candidate.location;
    }
  }

  makeDemandCaption(id: string) {
    return '#' + id.replace(rowNumber, '$1. ').replace(/_/g, ' ');
  }
}