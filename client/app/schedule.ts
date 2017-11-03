import { ViewChild, ElementRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BaseComponent } from './base.component';
import { Utils } from './utils';

const day = 1000 * 60 * 60 * 24;
const week = day * 7;
const weekWidth = 60;
const dayWidth = weekWidth / 7;
const dayCoefficient = dayWidth / day;
const transparent = 'rgba(0,0,0,0)';

export class Schedule extends BaseComponent {

  @ViewChild('schedule') schedule: ElementRef;
  scrolled = false;

  fromDate: any;
  minDate: any = '3';
  maxDate: any = '0';
  shownWeeks = 0;
  weekTitles = [];

  todayOffset: number = -10;
  todayCaption = '';

  public form = new FormGroup({});

  constructor(service) {
    super(service);

    this.fromDate = new Date();
    this.fromDate.setMonth(this.fromDate.getMonth() - 2);
    this.fromDate = this.adjustToMonday(this.fromDate.toString());
  }

  ngAfterViewChecked() {
    if (this.schedule && !this.scrolled && this.todayOffset) {
      this.schedule.nativeElement.scrollTo(this.todayOffset - window.innerWidth / 2.5, 0);
      this.scrolled = true;
    }
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

}