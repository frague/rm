import { Component, ViewChild, ElementRef, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
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
const candidatesQueryKeys = ['requisition', 'candidate'];
const boolenise = ['canTravel', 'isBillable', 'isFunded', 'isBooked', 'onTrip'];
const allLocations = 'All';

@Component({
	selector: 'planner',
  templateUrl: './planner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlannerComponent extends Schedule {
  @ViewChild(ReportComponent, { static: true }) reportModal: ReportComponent;
  @ViewChild(DemandPlanComponent, { static: true }) demandPlan: DemandPlanComponent;
  @ViewChild(RequisitionModal, { static: true }) requisitionModal: RequisitionModal;
  @ViewChild(CandidateModal, { static: true }) candidateModal: CandidateModal;
  @ViewChild('sticky') boardOfFame: ElementRef;
  bofOffset: any = 'auto';

  get cardWidth() {return 120};
  get stickyClass() {return {sticky: this.bofOffset != 'auto'}};

  candidates = [];
  candidatesCount = 0;
  candidatesFound = 0;

  demands = [];

  reserved = {};
  deserved = {};

  accountsDemand = {};
  columns = ['pool', 'isBillable', 'isFunded', 'isBooked', 'onTrip', 'canTravel', 'onVacation'];

  _cd: ChangeDetectorRef;
  _cache: CacheService;
  now;

  filterStates = {FC: true, SP: true, VA: true};
  filterDeployments = {offshore: true, onsite: true};
  locations = [
    'SPB', 'SAR', 'US', 'KHR', 'KY', 'LV', 'KR', 'WR', 'BEL',
  ];
  filterLocations = this.locations.reduce((result, location) => {
    result[location] = true;
    return result;
  }, { All: true });
  filterService = {
    'Filter Users': false,
  };
  public get filterUsers(): boolean {
    return this.filterService['Filter Users'];
  }

  statesBadges = this._makeBadges(this.filterStates);
  deploymentsBadges = this._makeBadges(this.filterDeployments);
  locationsBadges = this._makeBadges(this.filterLocations);
  serviceBadges = this._makeBadges(this.filterService);

  private _bus: BusService;

  chosenBadges = [];
  get badgesAreSelected() {
    return this.chosenBadges.length > 0;
  }

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
      let [aChosen, bChosen] = [this.deserved[a.name], this.deserved[b.name]];
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
      this.candidatesFound = data.length;

      let names = [], demandsLogins = [];

      this.candidates = Object.keys(query).length
        ?
          this.items
            .filter(item => !item.isDemand)
            .slice(0, 100)
            .map(item => {
              let result = this.resourcesById[item.login] || {};
              if (item.login.indexOf(' ') > 0) {
                result.starts = item.minDate;
              };
              boolenise.forEach(key => result[key] = item[key] === 'true');
              [result.onVacation, result.proposed] = [item.onVacation, item.proposed];
              result.bookedAt = Object.keys(item.assignments).reduce((r, key) => {
                let a = item.assignments[key][0];
                if (a.isActive && a.billability === 'Booked') {
                  r = `${a.account}|${a.initiative}`;
                }
                return r;
              });
              names.push(result.name);
              return result;
            })
        :
          [];


      data.slice(0, 20).forEach(candidate => {
        candidate.isHiree = true;
        this.candidates.push(candidate);
        names.push(candidate.name);
      });

      this.candidatesCount = this.candidates.length;
      this._sortCandidates();

      this.demands = this.items
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

      this.demands.forEach(demand => {
        let account = demand.account;
        if (!this.accountsDemand[account]) {
          this.accountsDemand[account] = [];
        }
        this.accountsDemand[account].push(demand);
        demandsLogins.push(demand.login);
      });
      this.sanitizePlan(names, demandsLogins);
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
    cd: ChangeDetectorRef,
    private router: Router,
  ) {
    super(assignmentService, resourceService, initiativeService, demandService, bus, cache, cd);
    this._cd = cd;
    this._cache = cache;
    this._bus = bus;
    // this.toggleLocations({target: {checked: true}});
  }

  _makeBadges(source: any): any[] {
    return Object.keys(source).map(key => ({
      _id: key,
      title: key,
      className: source[key] ? '' : 'inactive',
      source
    }));
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
    let old = this.bofOffset;
    if (this.boardOfFame && this.boardOfFame.nativeElement) {
      let windowOffset = window.pageYOffset;
      let element = this.boardOfFame.nativeElement;
      let offset = element.offsetParent.offsetTop;
      let cardsHeight = element.clientHeight;
      if (windowOffset > offset) {
        this.bofOffset = (windowOffset - offset + cardsHeight) + 'px';
      } else {
        this.bofOffset = 'auto';
      }
      requestAnimationFrame(() => this.markForCheck());
    }
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
    let demandRow = this.deserved[candidate.name];
    let candidateId = this.reserved[demand.login];
    if (demandRow) {
      this.reserved[demandRow] = '';
    }
    if (candidateId) {
      this.deserved[candidateId] = '';
    }
    if (candidate.name != candidateId) {
      this.reserved[demand.login] = candidate.name;
      this.deserved[candidate.name] = demand.login;
    }
  }

  setReservations({rows, logins}) {
    this.reserved = {};
    this.deserved = {};

    rows.forEach((row, index) => {
      let login = logins[index];
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
      proposed: preselected && matched,
      [this.getCellCaption(candidate, demand)]: true,
      vacation: !!candidate.onVacation,
    };
  }

  getCellCaption(candidate, demand) {
    let bookedAt;
    let index = (demand.candidates || []).indexOf(candidate.name);
    if (index < 0) return '';
    if (candidate.bookedAt === `${demand.account}|${demand.project}`) return 'Booked';
    return demand.candidatesStati[index];
  }

  isReserved(candidate: any, demand: any) {
    return this.reserved[demand.login] === candidate.name;
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
    let locations = !this.filterUsers || this.filterLocations[user.location];
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
    return Object.keys(
      []
        .concat(this.reserved[demand.login], demand.candidates)
        .filter(c => !!c)
        .reduce((result, c) => {
          result[c] = true;
          return result;
        }, {})
    ).sort().join(', ');

  }

  getDemandAttrs(demand) {
    return (demand.grades || '') + ' (' + (demand.locations || '') + ')';
  }

  getDemandRequisitions(demand) {
    return (demand.requestId || []);
  }

  isAssigned(candidate: any) {
    return Object.values(this.reserved).indexOf(candidate.name) >= 0;
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
      billable: candidate.isBillable,
      funded: candidate.isFunded,
      booked: candidate.isBooked,
      assigned: this.isAssigned(candidate),
      hiree: candidate.isHiree,
      accepted: candidate.login && candidate.login.indexOf(' ') > 0,
      vacation: !!candidate.onVacation,
      proposed: candidate.proposed && candidate.proposed.length
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
    let short = badge.short || Utils.abbreviate(badge.title);
    if (!this._chosenBadgesNames[short]) {
      this._chosenBadgesNames[short] = true;
      this.chosenBadges.push(badge);
      this._calculateVisibleCandidates();
    } else {
      this.removeBadge(badge);
    }
    this._bus.badgeUpdated.emit();
  }

  removeBadge(badge: any) {
    delete this._chosenBadgesNames[badge.short || Utils.abbreviate(badge.title)];
    this.chosenBadges = this.chosenBadges.filter(b => b._id !== badge._id);
    this._calculateVisibleCandidates();
  }

  showAccount(account: string): void {
    this._bus.criteriaUpdated.emit(`assignments.account=${account},columns=name|grade|location,order=location|name`);
    this.router.navigate(['/reports']);
  }

  toggleFilter(badge) {
    let {_id, source} = badge;
    if (source) {
      let toggled = !source[_id];
      if (_id === allLocations) {
        this.locationsBadges.forEach(locBadge => {
          source[locBadge._id] = toggled;
          locBadge.className = toggled ? '' : 'inactive';
        });
      } else {
        source[_id] = toggled;
        badge.className = toggled ? '' : 'inactive';

        if (source.hasOwnProperty(allLocations)) {
          let allState = this.locations.reduce((result, loc) => result && source[loc], toggled) && toggled;
          source[allLocations] = allState;
          this.locationsBadges.some(b => {
            if (b._id === allLocations) {
              b.className = allState ? '' : 'inactive';
              return true;
            }
          });
        }
      }
      this._bus.badgeUpdated.emit();
    }
  }
}