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

  reserved = {};
  deserved = {};

  accountsDemand = {};

  postFetch = () => {
    this.accountsDemand = {};

    this.candidates = this.items
      .filter(item => !item.isDemand)
      .slice(0, 16)
      .map(item => {
        let result = this.resourcesById[item._id] || {};
        ['canTravel', 'billable'].forEach(key => result[key] = item[key] === 'true');
        return result;
      });
    this.candidatesCount = this.candidates.length;
    this.demands = this.items
      .filter(item => item.isDemand)
      .map(item => {
        let assignments = item.assignments;
        return assignments[Object.keys(assignments)[0]][0].demand;
      });
    this.demands.forEach(demand => {
      let account = demand.account;
      if (!this.accountsDemand[account]) {
        this.accountsDemand[account] = [];
      }
      this.accountsDemand[account].push(demand);
    });
    // this.cd.markForCheck();
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

  getAccounts() {
    return Object.keys(this.accountsDemand).sort();
  }

  getCandidates() {
    return this.candidates;
  }

  makeCaption(demand) {
    return demand.name;
  }

  showResource(resource: any, isDemand=false) {
    if (isDemand) {
      return this.demandModal.show(resource);
    } else {
      return this.personModal.show(this.resourcesById[resource._id])
    }
  }

  reserve(candidate: any, demand: any) {
    let demandId = this.deserved[candidate._id];
    let candidateId = this.reserved[demand._id];
    if (demandId) {
      this.reserved[demandId] = '';
    }
    if (candidateId) {
      this.deserved[candidateId] = '';
    }
    if (candidate._id != candidateId) {
      this.reserved[demand._id] = candidate._id;
      this.deserved[candidate._id] = demand._id;
    }
  }

  getReservation(candidate: any, demand: any) {
    return this.reserved[demand._id] === candidate._id;
  }

  getDemandAttrs(demand) {
    return (demand.grades || []).join(', ') + ' (' + (demand.locations || []).join(', ') + ')';
  }

  isAssigned(candidate: any) {
    return Object.values(this.reserved).indexOf(candidate._id) >= 0;
  }

  isOnsite(demand) {
    return demand.deployment.toLowerCase().indexOf('onsite') >= 0;
  }
}