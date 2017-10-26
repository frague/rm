import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastComponent } from '../shared/toast/toast.component';

import { BaseComponent } from '../base.component';

import { AssignmentService } from '../services/assignment.service';
import { InitiativeService } from '../services/initiative.service';
import { ResourceService } from '../services/resource.service';

import { PersonComponent } from '../people/person.component';

import { Utils } from '../utils';

const day = 1000 * 60 * 60 * 24;
const week = day * 7;
const weekWidth = 60;
const dayWidth = weekWidth / 7;
const dayCoefficient = dayWidth / day;
const transparent = 'rgba(0,0,0,0)';
const emptyItem = {assignments: []};

@Component({
  selector: 'assignments',
  templateUrl: './assignments.component.html',
  styleUrls: ['./assignments.component.scss']
})
export class AssignmentsComponent extends BaseComponent implements OnInit {

  @ViewChild(PersonComponent) person: PersonComponent;

  resources = [];
  resourcesById = {};

  initiatives = {};
  assignments = [];
  item = {};

  minDate: any = '3';
  maxDate: any = '0';
  shownWeeks = 0;
  weekTitles = [];

  todayOffset: number = -10;
  todayCaption = '';

  public form = new FormGroup({
    _id: new FormControl(''),
    resourceId: new FormControl('', Validators.required),
    initiativeId: new FormControl('', Validators.required),
    start: new FormControl('', Validators.required),
    end: new FormControl('', Validators.required),
    billability: new FormControl('', Validators.required),
    involvement: new FormControl('100', Validators.required),
    comment: new FormControl('')
  });

  constructor(
    assignmentService: AssignmentService,
    private resourceService: ResourceService,
    private initiativeService: InitiativeService,
    private toast: ToastComponent
  ) {
    super(assignmentService);
  }

  getInitiatives() {
    return Object.values(this.initiatives);
  }

  getAssignmentsCount(index) {
    return 'an' + Object.keys((this.items[index] || emptyItem).assignments).length;
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

  ngOnInit() {
    this.getAll();
    this.resourceService.getAll().subscribe(
      data => {
        this.resources = data;
        this.resourcesById = data.reduce((result, person) => {
          result[person._id] = person;
          return result;
        }, {});
      },
      error => console.log(error)
    );
    this.initiativeService.getAll().subscribe(
      data => {
        this.initiatives = data.reduce((result, initiative) => {
          result[initiative._id] = initiative;
          return result;
        }, {})
      },
      error => console.log(error)
    );
  }

  cleanup(item) {
    let clean = Object.assign({}, item);
    delete clean.offset;
    delete clean.width;
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
    // console.log(dateString, dow, date);
    return date;
  }

  getAll() {
    super.getAll(() => {
      this.minDate = '3';
      this.maxDate = '0';

      this.items = this.items.sort((a, b) => (a.name > b.name) ? 1 : -1);

      this.items.forEach(resource => {
        if (resource.minDate && resource.minDate < this.minDate) this.minDate = resource.minDate;
        if (resource.maxDate && resource.maxDate > this.maxDate) this.maxDate = resource.maxDate;
      });

      this.minDate = this.adjustToMonday(this.minDate, false);
      this.maxDate = this.adjustToMonday(this.maxDate);
      let maxTime = this.maxDate.getTime();
      this.shownWeeks = Math.round((maxTime - this.minDate.getTime()) / week);
      let minTime = this.minDate.getTime();
      // console.log(this.minDate, this.maxDate, this.shownWeeks);

      this.items.forEach(resource => {
        let assignmentsGrouped = {};
        resource.assignments.forEach(assignment => {
          if (!assignmentsGrouped[assignment.initiativeId]) {
            assignmentsGrouped[assignment.initiativeId] = [];
          }
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
    });
  }

  showAssignment(assignment) {
    let initiative = this.initiatives[assignment.initiativeId] || {};
    return {
      name: initiative.name,
      account: initiative.account,
      color: initiative.color,
      billability: assignment.billability,
      involvement: assignment.involvement,
      offset: assignment.offset,
      width: assignment.width
    };
  }
}
