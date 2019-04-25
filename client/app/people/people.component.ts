import { Component, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Subscription, Observable, from } from 'rxjs';

import { AssignmentService } from '../services/assignment.service';
import { InitiativeService } from '../services/initiative.service';
import { ResourceService } from '../services/resource.service';
import { DemandService } from '../services/demand.service';
import { RequisitionService } from '../services/requisition.service';
import { BusService } from '../services/bus.service';

import { PersonModal } from '../modal/person-modal.component';
import { Schedule } from '../schedule';

const defaultColumns = {
  name: 'Name',
  grade: 'Grade',
  status: 'Status'
};

const candidatesQueryKeys = ['requisition', 'candidate', 'comments'];

@Component({
  selector: 'people',
  templateUrl: './people.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PeopleComponent extends Schedule {
  tableColumns = {};
  keys = {};
  isPrintable = false;
  requisitions = {};

  private _clickability = {
    name: this.showUser
  };

  constructor(
    assignmentService: AssignmentService,
    resourceService: ResourceService,
    initiativeService: InitiativeService,
    demandService: DemandService,
    bus: BusService,
    cd: ChangeDetectorRef,
    private requisitionService: RequisitionService
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

  postFetch = query => {
    let queryString = JSON.stringify(query);
    let requisitionsQuery = candidatesQueryKeys.some(key => queryString.indexOf(key + '.') >= 0) ?
      this.requisitionService.getAll(query) : from([[]]);

    return requisitionsQuery.subscribe(data => {
      data.slice(0, 100).forEach(requisition => {
        requisition.summary = `${requisition.requisitionId} ${requisition.title} (${requisition.jobState})`;
        this.items.push(requisition);
        requisition.candidates.forEach(candidate => {
          candidate.isHiree = true;
          this.items.push(candidate);
        });
      });
      this.markForCheck();
    });

  };

  getPrintableClass() {
    return this.isPrintable && 'printable';
  }

  togglePrintable() {
    this.isPrintable = !this.isPrintable;
  }
}
