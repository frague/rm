import { ViewChild, ElementRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';

import { BaseComponent } from './base.component';
import { Utils } from './utils';

import { PersonComponent } from './people/person.component';
import { AssignmentComponent } from './assignments/assignment.component';
import { DemandComponent } from './assignments/demand.component';

import { AssignmentService } from './services/assignment.service';
import { InitiativeService } from './services/initiative.service';
import { ResourceService } from './services/resource.service';
import { DemandService } from './services/demand.service';
import { BusService } from './services/bus.service';

const day = 1000 * 60 * 60 * 24;
const week = day * 7;
const weekWidth = 60;
const dayWidth = weekWidth / 7;
const dayCoefficient = dayWidth / day;
const transparent = 'rgba(0,0,0,0)';
const demandPrefix = 'Demand';
const demandCriteria = new RegExp(/\{['"]{0,1}(demand[.a-z]*)['"]{0,1}:['"]{0,1}([^'"]+)['"]{0,1}/, 'ig');

export class Schedule {

  @ViewChild(DemandComponent) demandModal: DemandComponent;
  @ViewChild(PersonComponent) personModal: PersonComponent;
  @ViewChild(AssignmentComponent) assignmentModal: AssignmentComponent;

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

  items = [];
  resources = [];
  resourcesById = {};
  demands = [];

  initiatives = {};
  assignments = [];
  item = {};
  message = '';

  accountInitiatives = {};
  accountsAssignments = {};
  initiativeAssignments = {};
  initiativesData = null;
  resourcesData = null;

  visibleAccounts = {};
  visibleInitiatives = {};

  postFetch = query => {};

  private $query;

  constructor(
    private assignmentService: AssignmentService,
    private resourceService: ResourceService,
    private initiativeService: InitiativeService,
    private demandService: DemandService,
    private bus: BusService
  ) {
    this.fromDate = new Date();
    this.fromDate.setMonth(this.fromDate.getMonth() - 2);
    this.fromDate = this.adjustToMonday(this.fromDate.toString());
  }

  ngOnInit() {
    this.$query = this.bus.filterUpdated.subscribe(([query, serviceData]) => this.fetchData(query, false, serviceData));
    this.fetchData(this.bus.filterQuery, true);
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
    if (resetAll) {
      this.initiativesData = null;
      this.resourcesData = null;
    }
  }

  findVisibleAccounts() {
    this.visibleAccounts = {};
    Object.keys(this.visibleInitiatives).forEach(
      initiativeId => this.visibleAccounts[(this.initiatives[initiativeId] || {}).account] = true
    );
  }

  fetchData(query={}, fetchAll=false, serviceData={}): Subscription {
    this.reset(fetchAll);

    let queryString = JSON.stringify(query);
    let demandQuery = queryString.indexOf('demand') >= 0 || queryString.indexOf('comments') >= 0 ?
      this.demandService.getAll(query) : Observable.from([[]]);

    let withOrder = Object.assign(query, { order: serviceData['order'] });
    return this.assignmentService.getAll(withOrder).subscribe(data => {
      [this.items, this.message] = [data.data, data.message];

      demandQuery.subscribe(demands => {
        if (!this.demands.length) {
          this.demands = demands;
        }

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

        demands.forEach((demand, index) => {
          let demandId = demand._id;
          let initiativeId = demandId;
          if (demandAccounts[demand.account]) {
            initiativeId = demandAccounts[demand.account];
          } else {
            demandAccounts[demand.account] = initiativeId;
          }
          demandResources.push(demand);

          if (showDemand) {
            let item = {
              _id: demandId,
              name: demand.name,
              login: demand.login,
              status: demand.status,
              commentsCount: demand.commentsCount,
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
              isDemand: true
            };
            demandItems.push(item);
          }
        });

        if (showDemand) {
          this.items = demandItems.concat(this.items);
        }

        this.calculate();
        let personStati = {};

        this.items.forEach(resource => {
          personStati[resource._id] = resource.status;

          Object.keys(resource.assignments).forEach(initiativeId => {
            this.initiativeAssignments[initiativeId] = (this.initiativeAssignments[initiativeId] || {});
            this.initiativeAssignments[initiativeId][resource._id] = resource.assignments[initiativeId];

            this.visibleInitiatives[initiativeId] = true;
          });
        });

        // Fetch Initiatives
        (this.initiativesData ? Observable.from([this.initiativesData]) : this.initiativeService.getAll()).subscribe(
          data => {
            this.initiativesData = Array.from(data);

            if (showDemand) {
              let demandInitiative = data.find(demand => demand.name === 'Demand');
              Object.keys(demandAccounts).forEach(account => {
                data.push(Object.assign(
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

            this.initiatives = data.reduce((result, initiative) => {
              result[initiative._id] = initiative;

              this._push(this.accountInitiatives, initiative.account, initiative);

              return result;
            }, {});
            this.findVisibleAccounts();
          },
          error => console.log(error)
        );

        // Fetch resources
        (this.resourcesData ? Observable.from([this.resourcesData]) : this.resourceService.getAll()).subscribe(
          data => {
            this.resourcesData = data;

            demandResources.forEach(demand => data.push({
              _id: demand._id,
              name: demand.name,
              isDemand: true
            }));

            this.resources = data;
            this.resourcesById = data.reduce((result, person) => {
              person.status = personStati[person._id];
              result[person.login] = person;
              return result;
            }, {});
          },
          error => console.log(error)
        ).add(() => this.postFetch(query));

        if (!fetchAll) {
          this.findVisibleAccounts();
        }

      });

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
    this.markerDateCaption = this.makeDateCaption(new Date(this.minDate.getTime() + this.markerDateOffset * day / dayWidth));
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

  getAssignmentsGroups(assignments: any, assignee: any) {
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

  showAssignment(assignment: any, event: MouseEvent) {
    event.stopPropagation();
    if (assignment.demand) {
      this.demandModal.show(assignment.demand);
    } else {
      this.assignmentModal.show(this.cleanup(assignment))
    }
  };

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