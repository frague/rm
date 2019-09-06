import { Component, ViewChild, ElementRef, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Schedule } from '../schedule';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { from } from 'rxjs';

import { ReportComponent } from './report.component';
import { DemandPlanComponent } from './demandplan.component';
import { RequisitionModal } from '../modal/requisition-modal.component';
import { CandidateModal } from '../modal/candidate-modal.component';

import { AssignmentService } from '../services/assignment.service';
import { InitiativeService } from '../services/initiative.service';
import { ResourceService } from '../services/resource.service';
import { DemandService } from '../services/demand.service';
import { CandidateService } from '../services/candidate.service';
import { CacheService } from '../services/cache.service';
import { BusService } from '../services/bus.service';

import { Utils } from '../utils';

const stripIndex = new RegExp(/^\d{2} /);
const rowNumber = new RegExp(/^(\d+):/);
const allowedStates = ['Open', 'Approved', 'Awaiting Approval', 'Draft'];
const candidatesQueryKeys = ['requisition', 'candidate', 'comments'];

@Component({
	selector: 'planner',
  templateUrl: './planner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlannerComponent extends Schedule {
  @ViewChild(ReportComponent) reportModal: ReportComponent;
  @ViewChild(DemandPlanComponent) demandPlan: DemandPlanComponent;
  @ViewChild(RequisitionModal) requisitionModal: RequisitionModal;
  @ViewChild(CandidateModal) candidateModal: CandidateModal;
  @ViewChild('sticky') boardOfFame: ElementRef;
  bofOffset: any = 'auto';

  get cardWidth() {return 120};

  candidates = [];
  candidatesCount = 0;

  reserved = {};
  deserved = {};

  accountsDemand = {};
  columns = ['pool', 'billable', 'onTrip', 'canTravel', 'onVacation'];

  _cd: ChangeDetectorRef;
  _cache: CacheService;
  now;

  filterStates = {FC: true, SP: true, VA: true};
  filterDeployments = {offshore: true, onsite: true};
  locations = [
    'SPB', 'SAR', 'US', 'KHR', 'KY', 'LV', 'KR', 'WR', 'BEL',
  ];
  filterLocations = {};
  filterUsers = false;

  chosenBadges = [];
  private _chosenBadgesNames = {};
  private get _allBadges() {
    return this._cache ? this._cache.get('badges') : [];
  }
  private get _itemBadges() {
    return this._cache ? this._cache.get('itemBadges') : {};
  };
  private _visibleCandidates = {};

  private _reset() {
    this.candidates = [];
    this.accountsDemand = {};
  }

  private _sortCandidates() {
    this.candidates = this.candidates.sort((a, b) => {
      let [aChosen, bChosen] = [this.deserved[a.login], this.deserved[b.login]];
      let [aIsHiree, bIsHiree] = [a.isHiree, b.isHiree];

      if (aChosen && !bChosen) return -1
      else if (!aChosen && bChosen) return 1
      else if (aIsHiree && !bIsHiree) return 1
      else if (!aIsHiree && bIsHiree) return -1;
      return a.name < b.name ? -1 : 1;
    });
  }

  postFetch = query => {
    this.now = new Date();

    this._reset();
    let queryString = JSON.stringify(query);
    let candidatesQuery = this._cache.getObservable('candidates') || (
      candidatesQueryKeys.some(key => queryString.indexOf(key + '.') >= 0) ? this.candidateService.getAll(query) : from([[]])
    );

    return candidatesQuery.subscribe(data => {
      this._cache.set('candidates', data);

      let peopleLogins = [], demandsLogins = [];

      this.candidates = Object.keys(query).length
        ?
          this.items
            .filter(item => !item.isDemand)
            .slice(0, 50)
            .map(item => {
              let result = this.resourcesById[item.login] || {};
              if (item.login.indexOf(' ') > 0) {
                result.starts = item.minDate;
              };
              ['canTravel', 'billable', 'onTrip'].forEach(key => result[key] = item[key] === 'true');
              result.onVacation = item.onVacation;
              peopleLogins.push(result.login);
              return result;
            })
        :
          [];


      data.slice(0, 20).forEach(candidate => {
        candidate.isHiree = true;
        this.candidates.push(candidate);
        peopleLogins.push(candidate.login);
      });

      this.candidatesCount = this.candidates.length;
      this._sortCandidates();

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
        demandsLogins.push(demand.login);
      });
      this.sanitizePlan(peopleLogins, demandsLogins);
      this._calculateVisibleCandidates();
      this.markForCheck();
    });

  };

  constructor(
    assignmentService: AssignmentService,
    resourceService: ResourceService,
    initiativeService: InitiativeService,
    demandService: DemandService,
    private candidateService: CandidateService,
    bus: BusService,
    cache: CacheService,
    cd: ChangeDetectorRef
  ) {
    super(assignmentService, resourceService, initiativeService, demandService, bus, cache, cd);
    this._cd = cd;
    this._cache = cache;
    this.toggleLocations({target: {checked: true}});
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
    this.markForCheck();
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

  sanitizePlan(people, demands) {
    Object.keys(this.reserved).forEach(row => {
      if (!demands.includes(row)) delete this.reserved[row];
    });
    Object.keys(this.deserved).forEach(engineer => {
      if (!people.includes(engineer)) delete this.deserved[engineer];
    });
  }

  getAccounts() {
    return Object.keys(this.accountsDemand).sort();
  }

  getCandidates() {
    return this.candidates;
  }

  makeCaption(demand) {
    return demand.name;
  }

  showReport() {
    this.reportModal.show(this.reserved);
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
    this._sortCandidates();
  }

  getCheckStyles(candidate, demand) {
    let matched = this.isReserved(candidate, demand);
    let preselected = demand.candidates.includes(candidate.name);
    return {
      matched: matched && !preselected,
      preselected: preselected && !matched,
      proposed: preselected && matched
    };
  }

  isReserved(candidate: any, demand: any) {
    return this.reserved[demand.login] === candidate.login;
  }

  isDemandVisible(demand: any) {
    if (!demand) return false;
    let state = this.filterStates[demand.stage];
    let deployment = this.filterDeployments[demand.deployment === 'Offshore' ? 'offshore' : 'onsite'];
    let location = demand.locations.split(', ').some(dl => this.filterLocations[dl]);
    return state && deployment && location;
  }

  isUserVisible(user: any) {
    let badgesSelected = this.chosenBadges.length > 0;
    if (!this.filterUsers && !badgesSelected) return true;
    let locations = this.filterLocations[user.location];
    let badges = badgesSelected ? this._visibleCandidates[user._id] : true;
    return locations && badges;
  }

  getCandidatesCount() {
    let badgesSelected = this.chosenBadges.length > 0;
    if (!this.filterUsers && !badgesSelected) return this.candidatesCount;
    return this.candidates.reduce((p, v) => {
      p += (!this.filterUsers || this.filterLocations[v.location]) && (!badgesSelected || this._visibleCandidates[v._id]) ? 1 : 0;
      return p;
    }, 0);
    console.log();
  }

  toggleLocations(event: any) {
    let state = event.target.checked;
    this.filterLocations = this.locations.reduce((p, v) => {
      p[v] = state;
      return p;
    }, {});
  }

  getDemandStyles(demand: any) {
    let expired = new Date(demand.start) < this.now;
    return {
      covered: this.reserved[demand.login],
      [demand.stage]: true,
      booked: demand.isBooked,
      warning:
        ((!demand.candidates || !demand.candidates.length) &&
        (!demand.requestId || !demand.requestId.length)),
      expired
    };
  }

  getDemandCandidate(demand: any) {
    return [].concat(this.reserved[demand.login], demand.candidates).filter(c => !!c).join(', ');
  }

  getDemandAttrs(demand) {
    return (demand.grades || '') + ' (' + (demand.locations || '') + ')';
  }

  getDemandRequisitions(demand) {
    return (demand.requestId || []);
  }

  isAssigned(candidate: any) {
    return Object.values(this.reserved).indexOf(candidate.login) >= 0;
  }

  isOnsite(demand) {
    return demand.deployment.toLowerCase().indexOf('on-site') >= 0;
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

  showReqStatus(demand, index) {
    let state = (demand.requisitionsStates || {})[index];
    return {
      'text-danger': !state,
      'striked': state && !allowedStates.includes(state)
    };
  }

  getCardClass(candidate: any) {
    return {
      billable: candidate.billable,
      assigned: this.isAssigned(candidate),
      hiree: candidate.isHiree,
      accepted: candidate.login && candidate.login.indexOf(' ') > 0,
      vacation: !!candidate.onVacation
    };
  }

  // Badges section
  private _calculateVisibleCandidates() {
    let badgesSelected = this.chosenBadges.length > 0;
    this._visibleCandidates = this.candidates
      .filter(user => {
        if (!badgesSelected) return true;
        let userBadges = this._itemBadges[user.login];
        return userBadges ? this.chosenBadges.every(b => userBadges.includes(b._id)) : false;
      })
      .reduce((p, user) => {
        p[user._id] = true;
        return p;
      }, {});
    this.markForCheck();
  }

  resetBadges() {
    this.chosenBadges = [];
    this._chosenBadgesNames = {};
    this._calculateVisibleCandidates();
  }

  toggleBadge(badge) {
    if (!this._chosenBadgesNames[badge.short]) {
      this._chosenBadgesNames[badge.short] = true;
      this.chosenBadges.push(badge);
      this._calculateVisibleCandidates();
    } else {
      this.removeBadge(this.chosenBadges.indexOf(badge));
    }
  }

  removeBadge(index: number) {
    let badge = this.chosenBadges[index];
    delete this._chosenBadgesNames[badge.short];
    this.chosenBadges.splice(index, 1);
    this._calculateVisibleCandidates();
  }

  getBadgeStyle(badge) {
    return {
      backgroundColor: badge.color
    }
  }
}