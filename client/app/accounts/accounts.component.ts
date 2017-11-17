import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastComponent } from '../shared/toast/toast.component';

import { BaseComponent } from '../base.component';

import { AssignmentService } from '../services/assignment.service';
import { InitiativeService } from '../services/initiative.service';
import { ResourceService } from '../services/resource.service';
import { DemandService } from '../services/demand.service';
import { BusService } from '../services/bus.service';

import { PersonComponent } from '../people/person.component';

import { Schedule } from '../schedule';

const demandPrefix = 'Demand';

@Component({
  selector: 'accounts',
  templateUrl: './accounts.component.html'
})
export class AccountsComponent extends Schedule {

  constructor(
    assignmentService: AssignmentService,
    resourceService: ResourceService,
    initiativeService: InitiativeService,
    demandService: DemandService,
    bus: BusService
  ) {
    super(assignmentService, resourceService, initiativeService, demandService, bus);
  }

  getAssignmentsCount(initiative) {
    return 'an' + this.getPersonInitiativeAssignments(initiative).length;
  }

  getAssignment(assignment) {
    let initiative = this.initiatives[assignment.initiativeId] || {};
    let resource = this.resourcesById[assignment.resourceId] || {name: '...', grade: '...'};
    let demand = assignment.demand;
    return {
      name: (demand ? (demand.profile + ': ' + demand.comment) : resource.name + ', ' + resource.grade),
      account: initiative.account,
      color: initiative.color,
      billability: assignment.billability,
      involvement: assignment.involvement,
      offset: assignment.offset,
      width: assignment.width
    };
  }
}
