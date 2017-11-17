import { Component } from '@angular/core';
import { Schedule } from '../schedule';

import { AssignmentService } from '../services/assignment.service';
import { InitiativeService } from '../services/initiative.service';
import { ResourceService } from '../services/resource.service';
import { DemandService } from '../services/demand.service';
import { BusService } from '../services/bus.service';

@Component({
	selector: 'planner',
  templateUrl: './planner.component.html'
})
export class PlannerComponent extends Schedule {
  candidatesCount = 0;

  constructor(
    assignmentService: AssignmentService,
    resourceService: ResourceService,
    initiativeService: InitiativeService,
    demandService: DemandService,
    bus: BusService
  ) {
    super(assignmentService, resourceService, initiativeService, demandService, bus);
  }

  getDemands() {
    return this.items.filter(item => item.isDemand);
  }

  getCandidates() {
    let candidates = this.items.filter(item => !item.isDemand).slice(0, 16).map(item => this.resourcesById[item._id] || {});
    this.candidatesCount = candidates.length;
    return candidates;
  }

  makeCaption(demand) {
    return demand.name;
  }

  showResource(assignee: any) {
    if (assignee.isDemand) {
      let assignments = assignee.assignments;
      if (assignments) {
        return this.demandModal.show(assignments[Object.keys(assignments)[0]][0].demand);
      }
    } else {
      return this.personModal.show(this.resourcesById[assignee._id])
    }
  }


}