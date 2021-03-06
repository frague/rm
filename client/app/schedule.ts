import { ViewChild, ElementRef, ChangeDetectorRef, Directive } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription, from, forkJoin } from 'rxjs';

import { Utils } from './utils';

import { AssignmentModal } from './modal/assignment-modal.component';
import { DemandModal } from './modal/demand-modal.component';
import { RequisitionModal } from './modal/requisition-modal.component';
import { CandidateModal } from './modal/candidate-modal.component';

import { AssignmentService } from './services/assignment.service';
import { InitiativeService } from './services/initiative.service';
import { ResourceService } from './services/resource.service';
import { DemandService } from './services/demand.service';
import { CacheService } from './services/cache.service';
import { BusService } from './services/bus.service';

const day = 1000 * 60 * 60 * 24;
const week = day * 7;
const weekWidth = 60;
const dayWidth = weekWidth / 7;
const dayCoefficient = dayWidth / day;
const transparent = 'rgba(0,0,0,0)';
const demandPrefix = 'Demand';
const demandCriteria = new RegExp(/\{['"]{0,1}(demand[.a-z]*)['"]{0,1}:['"]{0,1}([^'"]+)['"]{0,1}/, 'ig');

@Directive()
export class Schedule {

  @ViewChild(DemandModal, { static: true }) demandModal: DemandModal;
  @ViewChild(AssignmentModal, { static: true }) assignmentModal: AssignmentModal;
  @ViewChild(RequisitionModal, { static: true }) requisitionModal: RequisitionModal;
  @ViewChild(CandidateModal, { static: true }) candidateModal: CandidateModal;

  @ViewChild('schedule') schedule: ElementRef;

  fromDate: any;
  shownWeeks = 0;
  weekTitles = [];

  todayOffset: number = -10;
  todayCaption = '';

  markerDateOffset: number = -10;
  markerDateCaption = '';

  public form = new FormGroup({});

  minDate: any = '3';
  maxDate: any = '0';

  isScrolled = false;
  isCalculated = false;
  loadingCounter = 0;

  items = [];
  resources = [];
  resourcesById = {};

  initiatives = {};
  assignments = [];
  item = {};
  message = '';

  accountInitiatives = {};
  accountsAssignments = {};
  initiativeAssignments = {};

  visibleAccounts = {};
  visibleInitiatives = {};

  assignmentsFound = 0;

  _cache: CacheService;
  _bus: BusService;

  postFetch = (query, serviceData?) => from([]).subscribe();

  private $query;

  columns = [];

  constructor(
    private assignmentService: AssignmentService,
    private resourceService: ResourceService,
    private initiativeService: InitiativeService,
    private demandService: DemandService,
    private bus: BusService,
    private cache: CacheService,
    private cd: ChangeDetectorRef
  ) {
    this.fromDate = new Date();
    this.fromDate.setMonth(this.fromDate.getMonth() - 2);
    this.fromDate = this.adjustToMonday(this.fromDate.toString());
    this._cache = cache;
    this._bus = bus;
  }

  ngOnInit() {
    this.$query = this.bus.filterUpdated.subscribe(([query, serviceData]) => {
      this.cache.reset(['plans', 'demands', 'assignments', 'candidates', 'requisitions']);  // Initiatives and resources don't change btw requests
      this.fetchData(query, false, serviceData);
    });
    this.fetchData(this.bus.filterQuery, true, this.bus.serviceData);
  }

  ngAfterViewChecked() {
    if (this.schedule && !this.isScrolled && this.todayOffset && this.isCalculated) {
      this.schedule.nativeElement.scrollTo(this.todayOffset - window.innerWidth / 2.5, 0);
      this.isScrolled = true;
    }
  }

  ngOnDestroy() {
    this.$query.unsubscribe();
  }

  markForCheck() {
    this.cd.markForCheck();
  }

  private _push(collection: any, key: string, item: any, makeUnique=true) {
    collection[key] = collection[key] || [];
    if (!makeUnique || collection[key].indexOf(item) < 0) {
      collection[key].push(item);
    }
  }

  cleanup(item) {
    let clean = Object.assign({}, item);
    delete clean.offset;
    delete clean.width;
    delete clean.__v;
    clean.comment = clean.comment || '';
    this.markForCheck();
    return clean;
  }

  reset(resetAll=false) {
    this.minDate = '3';
    this.maxDate = '0';
    this.isScrolled = false;
    this.isCalculated = false;
    this.items = [];

    this.accountsAssignments = {};
    this.accountInitiatives = {};
    this.initiativeAssignments = {};

    this.visibleInitiatives = {};
  }

  findVisibleAccounts() {
    this.visibleAccounts = {};
    Object.keys(this.visibleInitiatives).forEach(
      initiativeId => this.visibleAccounts[(this.initiatives[initiativeId] || {}).account] = true
    );
  }

  fetchData(query: any={}, fetchAll=false, serviceData={}): Subscription {
    this.markForCheck();

    let queryString = JSON.stringify(query);

    ['demands', 'requisitions', 'candidates', 'assignments', 'initiatives', 'resources'].forEach((entity: string) => this._cache.get(entity));

    if (!query || !query.or || !query.or.length) {
      // Returns empty sets for an empty query
      ['demands', 'requisitions', 'candidates'].forEach((entity: string) => this._cache.set(entity, []));
      this._cache.set('assignments', {message: '', data: []});
    }

    let shift = serviceData['shift'];
    let order = serviceData['order'];

    let demandQuery = this._cache.getObservable('demands') || (
      (!queryString.includes('demand=false') && queryString.includes('demand')) ?
      this.demandService.getAll({...query, order}) :
      from([[]])
    );
    let initiativesQuery = this._cache.getObservable('initiatives') || this.initiativeService.getAll();
    let resourcesQuery = this._cache.getObservable('resources') || this.resourceService.getAll();

    let withModifiers = {
      ...query,
      columns: this.columns.concat(Object.keys(serviceData['columns'] || {})).join(','),
      order,
      shift
    };

    let assignmentsQuery = this._cache.getObservable('assignments') || this.assignmentService.getAll(withModifiers);

    return forkJoin(
      demandQuery,
      initiativesQuery,
      resourcesQuery,
      assignmentsQuery
    )
      .subscribe(([demands, initiatives, resources, assignments]) => {
        this._cache.set('demands', demands);
        this._cache.set('initiatives', initiatives);
        this._cache.set('resources', resources);
        this._cache.set('assignments', assignments);

        this.reset(fetchAll);

        [this.items, this.message] = [[].concat(assignments.data), assignments.message];
        this.assignmentsFound = this.items.length;

        let showDemand = false;
        (queryString.match(demandCriteria) || []).forEach(criterion => {
          showDemand = true;
          let [key, value] = criterion.split(':');
          key = key.slice(2, -1);
          if (key === 'demand') {
            if (value === '"only"') {
              this.items = [];
            } else if (value === '"true"') {
              showDemand = true;
            } else if (value === '"false"') {
              showDemand = false;
            }
          }
        });

        let demandAccounts = {};
        let demandResources = [];
        let demandItems = [];
        if (showDemand) {
          demands.forEach((demand, index) => {
            let demandId = demand._id;
            let id = demand.name.split(' ')[0];
            let initiativeId = demandId;
            if (demandAccounts[demand.account]) {
              initiativeId = demandAccounts[demand.account];
            } else {
              demandAccounts[demand.account] = initiativeId;
            }
            demandResources.push(demand);

            let item = {
              _id: demandId,
              id,
              name: demand.name,
              login: demand.login,
              status: demand.status,
              commentsCount: demand.commentsCount,
              comments: demand.comments,
              assignments: [{
                _id: demandId,
                start: demand.start,
                end: demand.end,
                initiativeId,
                resourceId: demandId,
                billability: demand.role,
                involvement: 100,
                comment: demand.comment,
                demand
              }],
              pool: demand.pool,
              minDate: demand.start,
              maxDate: demand.end,
              isDemand: true,
              demand
            };
            demandItems.push(item);
          });

          this.items = demandItems.concat(this.items);
        }

        this.calculate();
        if (shift) {
          this.setShiftMarker(shift);
        }

        let personStati = {};

        this.items.forEach(resource => {
          personStati[resource._id] = resource.status;
          Object.keys(resource.assignments || {}).forEach(initiativeId => {
            this.initiativeAssignments[initiativeId] = (this.initiativeAssignments[initiativeId] || {});
            this.initiativeAssignments[initiativeId][resource.login] = resource.assignments[initiativeId];
            this.visibleInitiatives[initiativeId] = true;
          });
        });

        let shownInitiatives = [...initiatives];
        if (showDemand) {
          let demandInitiative = initiatives.find(demand => demand.name === 'Demand');
          Object.keys(demandAccounts).forEach(account => {
            shownInitiatives.push(Object.assign(
              {},
              demandInitiative,
              {
                _id: demandAccounts[account],
                isDemand: true,
                account
              }
            ));
          });
        }
        this.initiatives = shownInitiatives.reduce((result, initiative) => {
          result[initiative._id] = initiative;

          this._push(this.accountInitiatives, initiative.account, initiative);

          return result;
        }, {});
        this.findVisibleAccounts();

        this.resources = [...resources];
        demandResources.forEach(demand => this.resources.push({
          _id: demand._id,
          name: demand.name,
          isDemand: true
        }));

        this.resourcesById = this.resources.reduce((result, person) => {
          person.status = personStati[person._id];
          result[person.login] = person;
          return result;
        }, {});
      })
        .add(() => {
          this.postFetch(query, serviceData).add(() => this.markForCheck());
        });
  }

  makeCaptionStyles(offset: number): Object {
    return {left: offset + 2 + 'px'};
  }

  makeDateCaption(date) {
    return date.getDate() + '/' + Utils.leadingZero(date.getMonth() + 1);
  }

  setMarker(event: MouseEvent) {
    this.markerDateOffset = event.offsetX;
    let days = Math.round((this.markerDateOffset - this.todayOffset) / dayWidth);
    // let markerDate = new Date(this.minDate.getTime() + this.markerDateOffset * day / dayWidth);
    // this.markerDateCaption = this.makeDateCaption();
    days = days > 0 ? days : 0;
    this.setShiftMarker(days);
    this.bus.timeShiftUpdated.emit(days);
  }

  setShiftMarker(offset: number) {
    if (offset) {
      this.markerDateOffset = this.todayOffset + offset * dayWidth;
      this.markerDateCaption = `+${offset} days`;
    } else {
      this.markerDateOffset = -10;
      this.markerDateCaption = '';
    }
  }

  getScheduleStyles() {
    return {
      background:
        'repeating-linear-gradient(90deg, #000, #000 1px, ' + transparent + ' 1px, ' + transparent + ' ' + weekWidth + 'px), ' +
        'linear-gradient(90deg, red, red) ' + this.todayOffset + 'px top/2px auto repeat-y,' +
        'linear-gradient(90deg, #000, #000) ' + this.markerDateOffset + 'px top/2px auto repeat-y',
      width: (weekWidth * this.shownWeeks) + 1 + 'px'
    };
  }

  getInitiatives() {
    return Object.values(this.initiatives).filter((initiative: any) => !!this.visibleInitiatives[initiative._id]);
  }

  getAccountInitiatives(account: string) {
    return (this.accountInitiatives[account] || []).filter((initiative: any) => !!this.visibleInitiatives[initiative._id]);
  }

  getAssignmentsGroups(assignments: any) {
    if (!this.isCalculated) return [];
    return Object.values(assignments);
  }

  getAccounts() {
    return Object.keys(this.accountInitiatives).filter(account => !!this.visibleAccounts[account]).sort();
  }

  getPersonInitiativeAssignments(initiative) {
    return Object.keys(this.initiativeAssignments[initiative._id] || {})
  }

  getCurrentStatus(candidate: any): string {
    return (candidate && candidate.status) ? candidate.status.text : '';
  }

  adjustToMonday(dateString: string, doIncrease=true): Date {
    let date = new Date(dateString && dateString.length > 1 ? dateString : null);
    let dow = (date.getDay() + 6) % 7;
    if (dow) {
      let offset = date.getDate() + (doIncrease ? 7 - dow : -dow);
      date.setDate(offset);
    }
    return date;
  }

  calculate() {
    this.isCalculated = false;
    this.minDate = '3';
    this.maxDate = '0';
    let fromDate = this.fromDate.toString();
    let fromTime = this.fromDate.getTime();
    let today = new Date();

    this.items.forEach(resource => {
      if (resource.minDate && resource.minDate < this.minDate) this.minDate = resource.minDate;
      if (resource.maxDate && resource.maxDate > this.maxDate) this.maxDate = resource.maxDate;
    });

    // Cases when assignments don't have end date set
    if (this.maxDate < today.toISOString()) {
      let maxDate = new Date();
      maxDate.setMonth(maxDate.getMonth() + 1);
      this.maxDate = maxDate.toISOString();
    }

    this.minDate = this.adjustToMonday(this.minDate, false);
    this.maxDate = this.adjustToMonday(this.maxDate);
    let maxTime = this.maxDate.getTime();
    this.shownWeeks = Math.round((maxTime - this.minDate.getTime()) / week);
    if (this.shownWeeks < 0) {
      this.shownWeeks = 0;
    }
    let minTime = this.minDate.getTime();

    this.items.forEach(resource => {
      let assignmentsGrouped = {};
      if (Array.isArray(resource.assignments)) {
        resource.assignments.forEach(assignment => {
          if (!assignmentsGrouped[assignment.initiativeId]) {
            assignmentsGrouped[assignment.initiativeId] = [];
          }
          if (!assignment.start) {
            assignment.start = this.minDate;
          }
          let startDate = new Date(assignment.start);
          let start = startDate.getTime();
          let end = assignment.end ? new Date(assignment.end).getTime() : maxTime;
          assignment.offset = (start - minTime) * dayCoefficient;
          assignment.width = (end - start + day) * dayCoefficient - 1;

          if (!assignment.initiative && startDate > this.maxDate) {
            assignment.offset = (maxTime - minTime) * dayCoefficient;
            assignment.width = 1;
          }

          assignmentsGrouped[assignment.initiativeId].push(assignment);
        });
        resource.assignments = assignmentsGrouped;
      }
    });
    this.isCalculated = true;

    let start = new Date(this.minDate);
    this.weekTitles = new Array(this.shownWeeks + 1).join('.').split('').map(() => {
      let d = start.getDate();
      let w = d + '/' + Utils.leadingZero(start.getMonth() + 1);
      start.setDate(d + 7);
      return w;
    });

    this.todayOffset = Math.round((today.getTime() - minTime) * dayCoefficient);
    this.todayCaption = this.makeDateCaption(today);
  }

  showAssignment(assignment: any, assignee: any, event: MouseEvent) {
    if (typeof assignee === 'string') {
      assignee = this.resourcesById[assignee];
    }
    event.stopPropagation();
    if (assignment.demand) {
      this.showResource(assignee || assignment.demand);
    } else {
      let dummy = Object.assign({}, assignee, {assignments: [assignment]});
      this.assignmentModal.show(dummy);
    }
  };

  showRequisition(requisitionId: string, event: any = {}, showComments=false) {
    event.cancelBubble = true;
    this.requisitionModal.show(requisitionId, showComments && 'comments');
  }

  getDemandFrom(item: any) {
    return [item, item.demand ? item.demand : item];
  }

  getPersonFrom(item: any) {
    let person = this.resourcesById[item.login];
    // On vacation status comes from assignments
    person.onVacation = item.onVacation;
    return [item, person];
  }

  getCandidateFrom(item: any) {
    return [item, item];
  }

  private _showModal(entity, source, modal: {show: Function}, showComments=false) {
    if (!entity || !source) {
      return;
    }

    modal.show(source, showComments && 'comments')
      .subscribe(({status, commentsCount}) => {
        [entity.status, entity.commentsCount] = [status, commentsCount];
        this.markForCheck();
      });
  }

  showResource(item, showComments=false, event: MouseEvent = null) {
    if (event) {
      event.stopPropagation();
    }
    if (item.stage || item.isDemand) {
      // Only demand entity always contains "stage" key
      let [entity, source] = this.getDemandFrom(item);
      this._showModal(entity, source, this.demandModal, showComments);
    } else if (item.isHiree) {
      let [entity, source] = this.getCandidateFrom(item);
      this._showModal(entity, source, this.candidateModal, showComments);
    } else if (item.candidates) {
      this.showRequisition(item.requisitionId, event, showComments);
    } else {
      let [entity, source] = this.getPersonFrom(item);
      this._bus.showPerson.emit({
        entity: source,
        tab: showComments && 'comments',
        callback: ({status, commentsCount}) => {
          [entity.status, entity.commentsCount] = [status, commentsCount];
          this.markForCheck();
        }
      });
    }
  }

  isOnsite(assignee: any) {
    if (assignee.isDemand) {
      let assignments = assignee.assignments;
      if (assignments) {
        let demand = assignments[Object.keys(assignments)[0]][0].demand;
        if (demand.deployment.toLowerCase().indexOf('onsite') >= 0) return true;
      }
    }
    return false;
  }
}