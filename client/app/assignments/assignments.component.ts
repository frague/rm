import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastComponent } from '../shared/toast/toast.component';

import { BaseComponent } from '../base.component';

import { AssignmentService } from '../services/assignment.service';
import { InitiativeService } from '../services/initiative.service';
import { ResourceService } from '../services/resource.service';

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
      width: weekWidth * this.shownWeeks + 'px'
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

  adjustToMonday(date: Date, doIncrease=true): Date {
    let dow = (date.getDay() + 6) % 7;
    if (dow) {
      let offset = date.getDate() + (doIncrease ? 7 - dow : dow - 7);
      date.setDate(offset);
    }
    return date;
  }

  getAll() {
    super.getAll(() => {
      this.items.forEach(resource => {
        if (resource.minDate < this.minDate) this.minDate = resource.minDate;
        if (resource.maxDate > this.maxDate) this.maxDate = resource.maxDate;
      });

      this.minDate = this.adjustToMonday(new Date(this.minDate), false);
      this.maxDate = this.adjustToMonday(new Date(this.maxDate));
      this.shownWeeks = (this.maxDate.getTime() - this.minDate.getTime()) / week;

      this.items.forEach(resource => {
        resource.assignments.forEach(assignment => {
          let start = new Date(assignment.start).getTime();
          let end = new Date(assignment.end).getTime();
          assignment.offset = (start - this.minDate) * dayCoefficient;
          assignment.width = (end - start) * dayCoefficient;
        });
      });
    });
  }

  showAssignment(assignment) {
    let initiative = this.initiatives[assignment.initiativeId] || {};
    let a = {
      name: initiative.name,
      color: initiative.color,
      offset: assignment.offset,
      width: assignment.width
    };
    console.log(a);
    return a;
  }
}
