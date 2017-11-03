import { Component, OnInit, ViewChild } from '@angular/core';
import { ToastComponent } from '../shared/toast/toast.component';

import { Schedule } from '../schedule';

import { AssignmentService } from '../services/assignment.service';
import { InitiativeService } from '../services/initiative.service';
import { ResourceService } from '../services/resource.service';
import { DemandService } from '../services/demand.service';

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

  constructor(
    assignmentService: AssignmentService,
    resourceService: ResourceService,
    initiativeService: InitiativeService,
    demandService: DemandService
  ) {
    super(assignmentService, resourceService, initiativeService, demandService);
  }

  getAssignmentsCount(index) {
    return 'an' + Object.keys((this.items[index] || emptyItem).assignments).length;
  }

  showAssignment(assignment) {
    let initiative = this.initiatives[assignment.initiativeId] || {};
    let demand = assignment.demand;

    return {
      name: (demand ? (initiative.account + ': ' + demand.comment) : initiative.name),
      account: initiative.account,
      color: initiative.color,
      billability: assignment.billability,
      involvement: assignment.involvement,
      offset: assignment.offset,
      width: assignment.width
    };
  }
}
