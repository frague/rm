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
  status: 'Status'
};

@Component({
  selector: 'people',
  templateUrl: './people.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PeopleComponent extends Schedule {
  items = [];
  tableColumns = {};
  keys = {};
  isPrintable = false;

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
      clickable: this.isClickable(name),
      name: name === 'name'
    };
  }

  click(name: string, line: any) {
    const handler = this._clickability[name];
    if (handler) {
      handler.call(this, name, line);
    }
  }

  showUser(name: string, line: any) {
    return this.showResource(line);
  }

  showComments(candidate, event: MouseEvent) {
    event.stopPropagation();
    this.personModal.show(candidate.login, 'comments');
  }

  fetchData(query={}, fetchAll=false, serviceData: any={}): Subscription {
    this.tableColumns = serviceData.columns || defaultColumns;
    this.keys = Object.keys(this.tableColumns);
    query['addComments'] = 1;
    return super.fetchData(query, fetchAll, serviceData);
  }

  getPrintableClass() {
    return this.isPrintable && 'printable';
  }

  togglePrintable() {
    this.isPrintable = !this.isPrintable;
  }
}
