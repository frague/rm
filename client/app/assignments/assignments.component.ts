import { Component, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastComponent } from '../shared/toast/toast.component';

import { Schedule } from '../schedule';
import { AssignmentsReportComponent } from './report.component';

import { AssignmentService } from '../services/assignment.service';
import { InitiativeService } from '../services/initiative.service';
import { ResourceService } from '../services/resource.service';
import { DemandService } from '../services/demand.service';
import { BusService } from '../services/bus.service';

import { Utils } from '../utils';

const emptyItem = {assignments: []};

@Component({
  selector: 'assignments',
  templateUrl: './assignments.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssignmentsComponent extends Schedule {
  @ViewChild(AssignmentsReportComponent) reportModal: AssignmentsReportComponent;

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

  getAssignmentsCount(index) {
    return 'an' + Object.keys((this.items[index] || emptyItem).assignments).length;
  }

  getAssignment(assignment) {
    let initiative = this.initiatives[assignment.initiativeId] || {account: '...', name: '...', color: 'FFF'};
    let demand = assignment.demand;

    return {
      name: (demand ? (initiative.account + (demand.comment ? ': ' + demand.comment : '')) : initiative.name),
      account: initiative.account,
      color: initiative.color,
      billability: assignment.billability,
      involvement: assignment.involvement,
      offset: assignment.offset,
      width: assignment.width
    };
  }

  isOnTrip(assignee) {
    return Utils.isTrue(assignee.onTrip);
  }

  makeCaption(assignee) {
    return (assignee.grade ? assignee.grade + ', ' : '') + assignee.name;
  }

  getDemandFrom(item) {
    let assignments = item.assignments;
    if (assignments) {
      return [item, assignments[Object.keys(assignments)[0]][0].demand];
    }
  }

  showReport() {
    this.reportModal.show(this.items);
  }
}
