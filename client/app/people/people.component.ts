import { Component } from '@angular/core';
import { Subscription, Observable } from 'rxjs';

import { AssignmentService } from '../services/assignment.service';
import { InitiativeService } from '../services/initiative.service';
import { ResourceService } from '../services/resource.service';
import { DemandService } from '../services/demand.service';
import { BusService } from '../services/bus.service';

import { PersonComponent } from '../people/person.component';
import { Schedule } from '../schedule';

const defaultColumns = {
  name: 'Name',
  grade: 'Grade',
  location: 'Location',
  pool: 'Profile'
};


@Component({
  selector: 'people',
  templateUrl: './people.component.html'
})
export class PeopleComponent extends Schedule {

  items = [];
  columns = {};
  keys = {};

  constructor(
    assignmentService: AssignmentService,
    resourceService: ResourceService,
    initiativeService: InitiativeService,
    demandService: DemandService,
    bus: BusService
  ) {
    super(assignmentService, resourceService, initiativeService, demandService, bus);
  }

  fetchData(query={}, fetchAll=false, serviceData: any={}): Subscription {
    this.columns = serviceData.columns || defaultColumns;
    this.keys = Object.keys(this.columns);
    return super.fetchData(query, fetchAll);
  }

}
