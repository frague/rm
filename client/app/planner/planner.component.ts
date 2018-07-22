import { Component, ViewChild, ElementRef, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Schedule } from '../schedule';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';


import { ReportComponent } from './report.component';
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
  templateUrl: './planner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlannerComponent extends Schedule {
  @ViewChild(ReportComponent) reportModal: ReportComponent;
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

  _cd: ChangeDetectorRef;

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
              let result = this.resourcesById[item.login] || {};
              ['canTravel', 'billable', 'onTrip'].forEach(key => result[key] = item[key] === 'true');
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
      this._cd.markForCheck();
    });

  };

  constructor(
    assignmentService: AssignmentService,
    resourceService: ResourceService,
    initiativeService: InitiativeService,
    demandService: DemandService,
    private candidateService: CandidateService,
    bus: BusService,
    cd: ChangeDetectorRef
  ) {
    super(assignmentService, resourceService, initiativeService, demandService, bus, cd);
    this._cd = cd;
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
    this._cd.markForCheck();
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

  showResource(item: any, isDemand=false) {
    if (isDemand) {
      return this.demandModal.show(item);
    } else if (!item.isHiree) {
      return this.personModal.show(this.resourcesById[item.login]);
    }
  }

  showReport() {
    this.reportModal.show(this.reserved);
  }

  showRequisition(requisitionId: string, e: MouseEvent) {
    e.cancelBubble = true;
    this.requisitionModal.show(requisitionId);
  }

  showComments(item, event: MouseEvent) {
    event.stopPropagation();
    if (item.stage) {
      // Only demand entity always contains "stage" key
      return this.demandModal.show(item, 'notes');
    } else if (!item.isHiree) {
      return this.personModal.show(this.resourcesById[item.login], 'comments');
    }
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

  getCheckStyles(candidate, demand) {
    return {
      matched: this.isReserved(candidate, demand),
      preselected: demand.candidates.includes(candidate.name)
    };
  }

  isReserved(candidate: any, demand: any) {
    return this.reserved[demand.login] === candidate.login;
  }

  getDemandStyles(demand: any) {
    return {
      covered: this.reserved[demand.login],
      [demand.stage]: true,
      warning: !demand.candidates && !demand.requestId
    };
  }

  getDemandCandidate(demand: any) {
    return this.reserved[demand.login];
  }

  getDemandAttrs(demand) {
    return (demand.grades || '') + ' (' + (demand.locations || '') + ')';
  }

  getDemandRequisitions(demand) {
    return (demand.requestId || '').split(',').map(req => (req || '').trim());
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
    return '#' + id.replace(rowNumber, '$1. ').replace(/_/g, ' ').replace(/ for .+$/, '');
  }
}