import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastComponent } from '../shared/toast/toast.component';

import { BaseComponent } from '../base.component';

import { AssignmentService } from '../services/assignment.service';
import { InitiativeService } from '../services/initiative.service';
import { ResourceService } from '../services/resource.service';
import { DemandService } from '../services/demand.service';

import { PersonComponent } from '../people/person.component';

import { Utils } from '../utils';

const day = 1000 * 60 * 60 * 24;
const week = day * 7;
const weekWidth = 60;
const dayWidth = weekWidth / 7;
const dayCoefficient = dayWidth / day;
const transparent = 'rgba(0,0,0,0)';
const emptyItem = {assignments: []};
const demandPrefix = 'Demand';

@Component({
  selector: 'accounts',
  templateUrl: './accounts.component.html'
})
export class AccountsComponent extends BaseComponent implements OnInit {

  @ViewChild('schedule') schedule: ElementRef;

  scrolled = false;

  resources = [];
  resourcesById = {};

  initiatives = {};
  assignments = [];
  item = {};

  accountInitiatives = {};
  accountsAssignments = {};
  initiativeAssignments = {};

  fromDate: any;
  minDate: any = '3';
  maxDate: any = '0';
  shownWeeks = 0;
  weekTitles = [];

  todayOffset: number = -10;
  todayCaption = '';

  public form = new FormGroup({});

  constructor(
    assignmentService: AssignmentService,
    private resourceService: ResourceService,
    private initiativeService: InitiativeService,
    private demandService: DemandService,
    private toast: ToastComponent
  ) {
    super(assignmentService);
    this.fromDate = new Date();
    this.fromDate.setMonth(this.fromDate.getMonth() - 2);
    this.fromDate = this.adjustToMonday(this.fromDate.toString());
  }

  getInitiatives() {
    return Object.values(this.initiatives);
  }

  getAssignmentsCount(initiative) {
    return 'an' + this.getPersonInitiativeAssignments(initiative).length;
  }

  getScheduleStyles() {
    return {
      'background': 'repeating-linear-gradient(90deg, #000, #000 1px, ' + transparent + ' 1px, ' + transparent + ' ' + weekWidth + 'px), ' +
        'linear-gradient(90deg, ' + transparent + ' ' + this.todayOffset + 'px, red ' + this.todayOffset + 'px, ' + transparent + ' ' + (1 + this.todayOffset) + 'px) left top/' + (1 + this.todayOffset) + 'px repeat-y',
      width: (weekWidth * this.shownWeeks) + 1 + 'px'
    };
  }
  getAssignmentsGroups(assignments: any) {
    return Object.values(assignments);
  }

  getAccounts() {
    return Object.keys(this.accountInitiatives).sort();
  }

  getPersonInitiativeAssignments(initiative) {
    return Object.keys(this.initiativeAssignments[initiative._id] || {})
  }

  _push(collection: any, key: string, item: any, makeUnique=true) {
    collection[key] = collection[key] || [];
    if (!makeUnique || collection[key].indexOf(item) < 0) {
      collection[key].push(item);
    }
  }

  ngAfterViewChecked() {
    if (this.schedule && !this.scrolled && this.todayOffset) {
      this.schedule.nativeElement.scrollTo(this.todayOffset - window.innerWidth / 2.5, 0);
      this.scrolled = true;
    }
  }

  ngOnInit() {
    this.getAll().add(() => {
      this.demandService.getAll().subscribe(demands => {
        let demandAccounts = {};
        let demandResources = [];

        demands.forEach((demand, index) => {
          let demandId = demand._id;
          let initiativeId = demandId;
          if (demandAccounts[demand.account]) {
            initiativeId = demandAccounts[demand.account];
          } else {
            demandAccounts[demand.account] = initiativeId;
          }
          demandResources.push(demand);

          let item = {
            _id: demandId,
            name: demandPrefix + index,
            assignments: [{
              _id: demandId,
              start: demand.start,
              end: demand.end,
              initiativeId,
              resourceId: demandId,
              billability: demand.role,
              involvement: 100,
              comment: demand.comment
            }],
            minDate: demand.start,
            maxDate: demand.end
          };
          this.items.push(item);
        });
        this.calculate();
        console.log('Items', this.items);

        this.items.forEach(resource => {
          Object.keys(resource.assignments).forEach(initiativeId => {
            this.initiativeAssignments[initiativeId] = (this.initiativeAssignments[initiativeId] || {});
            this.initiativeAssignments[initiativeId][resource._id] = resource.assignments[initiativeId];
          });
        });
        console.log('Initiatives assignments', this.initiativeAssignments);

        this.initiativeService.getAll().subscribe(
          data => {
            let demandInitiative = data.find(demand => demand.name === 'Demand');

            Object.keys(demandAccounts).forEach(account => {
              data.push(Object.assign(
                {},
                demandInitiative,
                {
                  _id: demandAccounts[account],
                  account
                }
              ));
            });

            this.initiatives = data.reduce((result, initiative) => {
              result[initiative._id] = initiative;

              this._push(this.accountInitiatives, initiative.account, initiative);

              return result;
            }, {});
            console.log('Account initiatives', this.accountInitiatives);
          },
          error => console.log(error)
        );

        this.resourceService.getAll().subscribe(
          data => {
            demandResources.forEach(demand => data.push({
              _id: demand._id,
              name: demand.profile + ': ' + demand.comment
            }));
            console.log(demandResources);

            this.resources = data;
            this.resourcesById = data.reduce((result, person) => {
              result[person._id] = person;
              return result;
            }, {});
          },
          error => console.log(error)
        );

      });
    });
  }

  cleanup(item) {
    let clean = Object.assign({}, item);
    delete clean.offset;
    delete clean.width;
    delete clean.__v;
    clean.comment = clean.comment || '';
    return clean;
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
    this.minDate = '3';
    this.maxDate = '0';
    let fromDate = this.fromDate.toString();
    let fromTime = this.fromDate.getTime();

    this.items = this.items.sort((a, b) => (a.name > b.name) ? 1 : -1);

    this.items.forEach(resource => {
      if (resource.minDate && resource.minDate < this.minDate) this.minDate = resource.minDate;
      if (resource.maxDate && resource.maxDate > this.maxDate) this.maxDate = resource.maxDate;
    });

    // if (this.minDate < fromDate) {
    //   this.minDate = fromDate;
    // }

    this.minDate = this.adjustToMonday(this.minDate, false);
    this.maxDate = this.adjustToMonday(this.maxDate);
    let maxTime = this.maxDate.getTime();
    this.shownWeeks = Math.round((maxTime - this.minDate.getTime()) / week);
    let minTime = this.minDate.getTime();

    this.items.forEach(resource => {
      let assignmentsGrouped = {};
      resource.assignments.forEach(assignment => {
        if (!assignmentsGrouped[assignment.initiativeId]) {
          assignmentsGrouped[assignment.initiativeId] = [];
        }
        if (!assignment.start) assignment.start = this.minDate;

        let start = new Date(assignment.start).getTime();
        let end = assignment.end ? new Date(assignment.end).getTime() : maxTime;
        assignment.offset = (start - minTime) * dayCoefficient;
        assignment.width = (end - start + day) * dayCoefficient - 1;
        assignmentsGrouped[assignment.initiativeId].push(assignment);
      });
      resource.assignments = assignmentsGrouped;
    });

    let start = new Date(this.minDate);
    this.weekTitles = new Array(this.shownWeeks + 1).join('.').split('').map(() => {
      let d = start.getDate();
      let w = d + '/' + Utils.leadingZero(start.getMonth() + 1);
      start.setDate(d + 7);
      return w;
    });

    let today = new Date();
    this.todayOffset = Math.round((today.getTime() - minTime) * dayCoefficient);
    this.todayCaption = today.getDate() + '/' + Utils.leadingZero(today.getMonth() + 1);

    console.log(document.getElementById('schedule'));
    // document.getElementById('schedule').scrollLeft = this.todayOffset - 200;
  }

  showAssignment(assignment) {
    let initiative = this.initiatives[assignment.initiativeId] || {};
    let resource = this.resourcesById[assignment.resourceId] || {};
    return {
      name: resource.name,
      account: initiative.account,
      color: initiative.color,
      billability: assignment.billability,
      involvement: assignment.involvement,
      offset: assignment.offset,
      width: assignment.width
    };
  }
}
