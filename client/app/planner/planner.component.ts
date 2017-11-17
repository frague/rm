import { Component, ChangeDetectorRef } from '@angular/core';
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
  candidates = [];
  demands = [];
  candidatesCount = 0;

  postFetch = () => {
    this.candidates = this.items
      .filter(item => !item.isDemand)
      .slice(0, 16)
      .map(item => {
        let result = this.resourcesById[item._id] || {};
        ['canTravel', 'billable'].forEach(key => result[key] = item[key] === 'true');
        return result;
      });
    this.candidatesCount = this.candidates.length;
    this.demands = this.items.filter(item => item.isDemand);
    console.log(this.candidates);
    this.cd.markForCheck();
  };

  constructor(
    assignmentService: AssignmentService,
    resourceService: ResourceService,
    initiativeService: InitiativeService,
    demandService: DemandService,
    bus: BusService,
    private cd: ChangeDetectorRef
  ) {
    super(assignmentService, resourceService, initiativeService, demandService, bus);
  }

  getCandidates() {
    return this.candidates;
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