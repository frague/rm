import { Component, ViewChild, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

const billables = ['Billable', 'Funded', 'PTO Coverage'];

@Component({
  selector: 'assignments-report-modal',
  templateUrl: './report.component.html'
})
export class AssignmentsReportComponent {
  @ViewChild('content') content;
  assignments: any = {};

  constructor(private modalService: NgbModal) {}

  getInitiativeAssignments(initiativeId: string): any[] {
    return this.assignments[initiativeId] || [];
  }

  makeRange(cells: number): number[] {
    return new Array(cells).join('.').split('').map((value, index) => index + 1);
  }

  getClass(assignment: any) {
    let isBillable = billables.indexOf(assignment.billability) >= 0;
    return {
      'billable': isBillable,
      'non': !isBillable
    }
  }

  show(assignments: any) {
    let today = new Date().getTime();
    this.assignments = assignments.map(resource => {
      resource.assignmentsArray = [].concat(...Object.values(resource.assignments)).reduce((result, assignment) => {
        let end = assignment.end ? new Date(assignment.end).getTime() : Infinity;
        if (!assignment.isDemand && today < end) {
          result.push(assignment);
        }
        return result;
      }, []);
      resource.assignmentsCount = resource.assignmentsArray.length;
      return resource;
    });
    this.modalService.open(this.content, {size: 'lg'});
  }
}