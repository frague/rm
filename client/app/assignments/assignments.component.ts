import { Component, OnInit, ViewChild } from '@angular/core';
import { ToastComponent } from '../shared/toast/toast.component';

import { Schedule } from '../schedule';

import { AssignmentService } from '../services/assignment.service';
import { InitiativeService } from '../services/initiative.service';
import { ResourceService } from '../services/resource.service';

import { PersonComponent } from '../people/person.component';
import { AssignmentComponent } from './assignment.component';

const emptyItem = {assignments: []};

@Component({
  selector: 'assignments',
  templateUrl: './assignments.component.html'
})
export class AssignmentsComponent extends Schedule implements OnInit {

  @ViewChild(PersonComponent) personModal: PersonComponent;
  @ViewChild(AssignmentComponent) assignmentModal: AssignmentComponent;

  resources = [];
  resourcesById = {};

  initiatives = {};
  assignments = [];
  item = {};

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

  ngOnInit() {
    this.getAll().add(() => {
      this.calculate();
    });
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
    delete clean.__v;
    clean.comment = clean.comment || '';
    return clean;
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
