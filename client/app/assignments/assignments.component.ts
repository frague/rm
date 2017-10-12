import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastComponent } from '../shared/toast/toast.component';

import { BaseComponent } from '../base.component';

import { AssignmentService } from '../services/assignment.service';
import { InitiativeService } from '../services/initiative.service';
import { ResourceService } from '../services/resource.service';

import { Utils } from '../utils';

const day = 1000 * 60 * 60 * 24;
const week = day * 7;
const weekWidth = 60;
const dayWidth = weekWidth / 7;
const dayCoefficient = dayWidth / day;

@Component({
  selector: 'assignments',
  templateUrl: './assignments.component.html',
  styleUrls: ['./assignments.component.scss']
})
export class AssignmentsComponent extends BaseComponent implements OnInit {

  resources = [];
  initiatives = {};
  assignments = [];
  item = {};

  minDate: any = '3';
  maxDate: any = '0';
  shownWeeks = 0;
  weekTitles = [];

  public form = new FormGroup({
    _id: new FormControl(''),
    resourceId: new FormControl('', Validators.required),
    initiativeId: new FormControl('', Validators.required),
    start: new FormControl('', Validators.required),
    end: new FormControl('', Validators.required),
    isBillable: new FormControl(''),
    involvement: new FormControl('100', Validators.required),
    comment: new FormControl('')
  });

  constructor(
    assignmenService: AssignmentService,
    private resourceService: ResourceService,
    private initiativeService: InitiativeService,
    private toast: ToastComponent
  ) {
    super(assignmenService);
  }

  getInitiatives() {
    return Object.values(this.initiatives);
  }

  getScheduleStyles() {
    return {
      'background-image': 'repeating-linear-gradient(90deg, #000, #000 1px, #fff 1px, #fff ' + weekWidth + 'px)',
      width: (weekWidth * this.shownWeeks) + 1 + 'px'
    };
  }

  ngOnInit() {
    this.getAll();
    this.resourceService.getAll().subscribe(
      data => this.resources = data,
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
    console.log(dateString, dow, date);
    return date;
  }

  getAll() {
    super.getAll(() => {
      this.minDate = '3';
      this.maxDate = '0';

      this.items.forEach(resource => {
        if (resource.minDate && resource.minDate < this.minDate) this.minDate = resource.minDate;
        if (resource.maxDate && resource.maxDate > this.maxDate) this.maxDate = resource.maxDate;
      });

      this.minDate = this.adjustToMonday(this.minDate, false);
      this.maxDate = this.adjustToMonday(this.maxDate);
      this.shownWeeks = Math.round((this.maxDate.getTime() - this.minDate.getTime()) / week);
      console.log(this.minDate, this.maxDate, this.shownWeeks);

      this.items.forEach(resource => {
        resource.assignments.forEach(assignment => {
          let start = new Date(assignment.start).getTime();
          let end = new Date(assignment.end).getTime();
          assignment.offset = (start - this.minDate) * dayCoefficient;
          assignment.width = (end - start + day) * dayCoefficient - 1;
        });
      });

      let start = new Date(this.minDate);
      this.weekTitles = new Array(this.shownWeeks).join('.').split('').map(() => {
        let d = start.getDate();
        let w = d + '/' + Utils.leadingZero(start.getMonth() + 1);
        start.setDate(d + 7);
        return w;
      });
    });
  }

  showAssignment(assignment) {
    let initiative = this.initiatives[assignment.initiativeId] || {};
    return {
      name: initiative.name,
      color: initiative.color,
      offset: assignment.offset,
      width: assignment.width
    };
  }
}
