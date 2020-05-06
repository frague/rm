import { Component, ViewChild, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

const billables = ['Billable', 'Funded', 'PTO Coverage', 'Booked'];

@Component({
  selector: 'assignments-report-modal',
  templateUrl: './report.component.html'
})
export class AssignmentsReportComponent {
  @ViewChild('content', { static: true }) content;
  assignments: any = {};
  isPrintable = false;

  constructor(private modalService: NgbModal) {}

  getInitiativeAssignments(initiativeId: string): any[] {
    return this.assignments[initiativeId] || [];
  }

  makeRange(cells: number): number[] {
    return new Array(cells).join('.').split('').map((value, index) => index + 1);
  }

  isAssignmentBillable(assignment: any): boolean {
    return billables.indexOf(assignment.billability) >= 0 && assignment.involvement > 0;
  }

  getClass(userOrAssignment: any) {
    let isBillable = `${userOrAssignment.isBillable}` === 'true';
    return {
      'billable': isBillable,
      'non': !isBillable
    }
  }

  setPrintable(state: boolean) {
    this.isPrintable = state;
  }

  show(assignments: any) {
    let today = new Date().getTime();
    this.assignments = assignments.reduce((divided, resource) => {
      if (resource.isDemand) {
        return divided;
      }

      let isBillable = false;
      resource.assignmentsArray = [].concat(...Object.values(resource.assignments))
        .reduce((result, assignment) => {
          let end = assignment.end ? new Date(assignment.end).getTime() : Infinity;
          if (!assignment.demand && today < end) {
            result.push(assignment);
            isBillable = isBillable || this.isAssignmentBillable(assignment);
          }
          return result;
        }, []);
      resource.assignmentsCount = resource.assignmentsArray.length;
      if (!resource.assignmentsCount) {
        resource.assignmentsArray = [{}];
      }
      divided[isBillable ? 'Billable' : 'Non-billable'].push(resource);
      return divided;
    }, {'Billable': [], 'Non-billable': []});
    this.modalService.open(this.content, {size: 'xl'});
  }
}