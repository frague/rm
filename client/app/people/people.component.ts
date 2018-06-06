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

  private _clickability = {
    name: this.showUser
  };

  constructor(
    assignmentService: AssignmentService,
    resourceService: ResourceService,
    initiativeService: InitiativeService,
    demandService: DemandService,
    bus: BusService
  ) {
    super(assignmentService, resourceService, initiativeService, demandService, bus);
  }

  isClickable(name: string): boolean {
    return Object.keys(this._clickability).includes(name);
  }

  getClasses(name: string) {
    return {
      clickable: this.isClickable(name)
    };
  }

  click(name: string, value: any) {
    const handler = this._clickability[name];
    if (handler) {
      handler(value, name);
    }
  }

  showUser(value: any, name: string = '') {

  }

  fetchData(query={}, fetchAll=false, serviceData: any={}): Subscription {
    this.columns = serviceData.columns || defaultColumns;
    this.keys = Object.keys(this.columns);
    query['addComments'] = 1;
    return super.fetchData(query, fetchAll);
  }

}
