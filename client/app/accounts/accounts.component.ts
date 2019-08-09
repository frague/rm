import { Component, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AssignmentService } from '../services/assignment.service';
import { InitiativeService } from '../services/initiative.service';
import { ResourceService } from '../services/resource.service';
import { DemandService } from '../services/demand.service';
import { CacheService } from '../services/cache.service';
import { BusService } from '../services/bus.service';

import { Schedule } from '../schedule';

const demandPrefix = 'Demand';

@Component({
  selector: 'accounts',
  templateUrl: './accounts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountsComponent extends Schedule {

  constructor(
    assignmentService: AssignmentService,
    resourceService: ResourceService,
    initiativeService: InitiativeService,
    demandService: DemandService,
    bus: BusService,
    cache: CacheService,
    cd: ChangeDetectorRef
  ) {
    super(assignmentService, resourceService, initiativeService, demandService, bus, cache, cd);
  }

  getAssignmentsCount(initiative) {
    return 'an' + this.getPersonInitiativeAssignments(initiative).length;
  }

  getInitiativeCaption(initiative) {
    return initiative.name || 'Job offer accepted';
  }

  getAssignment(assignment) {
    let initiative = this.initiatives[assignment.initiativeId] || {};
    let resource = this.resourcesById[assignment.resourceId] || {name: '...', grade: '...'};
    let demand = assignment.demand;
    return {
      name: (demand ? (demand.name + (demand.comment ? ': ' + demand.comment : '')) : resource.name + ', ' + resource.grade),
      account: initiative.account,
      color: initiative.color,
      billable: (demand || assignment).billable,
      involvement: assignment.involvement,
      offset: assignment.offset,
      width: assignment.width,
      isAcceptor: !initiative.name
    };
  }
}
