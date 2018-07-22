import { Component, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastComponent } from '../shared/toast/toast.component';

import { Schedule } from '../schedule';
import { CommentsComponent } from '../planner/comments.component';
import { AssignmentsReportComponent } from './report.component';

import { AssignmentService } from '../services/assignment.service';
import { InitiativeService } from '../services/initiative.service';
import { ResourceService } from '../services/resource.service';
import { DemandService } from '../services/demand.service';
import { BusService } from '../services/bus.service';

const emptyItem = {assignments: []};

@Component({
  selector: 'assignments',
  templateUrl: './assignments.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssignmentsComponent extends Schedule {
  @ViewChild(CommentsComponent) commentsModal: CommentsComponent;
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
    return assignee.onTrip === 'true';
  }

  makeCaption(assignee) {
    return (assignee.grade ? assignee.grade + ', ' : '') + assignee.name;
  }

  showComments(candidate, event: MouseEvent) {
    event.stopPropagation();
    return this.personModal.show(this.resourcesById[candidate.login], 'comments');
  }

  showResource(assignee: any) {
    if (assignee.isDemand) {
      let assignments = assignee.assignments;
      if (assignments) {
        return this.demandModal.show(assignments[Object.keys(assignments)[0]][0].demand);
      }
    } else {
      return this.personModal.show(this.resourcesById[assignee.login])
    }
  }

  showReport() {
    this.reportModal.show(this.items);
  }
}
