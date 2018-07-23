import { Component, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Subscription, Observable } from 'rxjs';

import { AssignmentService } from '../services/assignment.service';
import { InitiativeService } from '../services/initiative.service';
import { ResourceService } from '../services/resource.service';
import { DemandService } from '../services/demand.service';
import { BusService } from '../services/bus.service';

import { PersonModal } from '../modal/person-modal.component';
import { Schedule } from '../schedule';

const defaultColumns = {
  name: 'Name',
  grade: 'Grade',
  location: 'Location',
  pool: 'Profile'
};

@Component({
  selector: 'people',
  templateUrl: './people.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
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
    bus: BusService,
    cd: ChangeDetectorRef
  ) {
    super(assignmentService, resourceService, initiativeService, demandService, bus, cd);
  }

  isClickable(name: string): boolean {
    return Object.keys(this._clickability).includes(name);
  }

  getClasses(name: string) {
    return {
      clickable: this.isClickable(name)
    };
  }

  click(name: string, line: any) {
    const handler = this._clickability[name];
    if (handler) {
      handler.call(this, name, line);
    }
  }

  showUser(name: string, line: any) {
    if (line.isDemand) {
      let assignments = line.assignments;
      if (assignments) {
        return this.demandModal.show(assignments[Object.keys(assignments)[0]][0].demand);
      }
    } else {
      return this.personModal.show(this.resourcesById[line.login])
    }
  }

  showComments(candidate, event: MouseEvent) {
    event.stopPropagation();
    this.personModal.show(candidate.login, 'comments');
  }

  fetchData(query={}, fetchAll=false, serviceData: any={}): Subscription {
    this.columns = serviceData.columns || defaultColumns;
    this.keys = Object.keys(this.columns);
    query['addComments'] = 1;
    return super.fetchData(query, fetchAll, serviceData);
  }

}
