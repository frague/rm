import { Component, ViewChild, ViewChildren, Input } from '@angular/core';
import { BaseModalComponent } from './base.component';
import { UserTabComponent } from './tabs/user-tab.component';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { AssignmentService } from '../services/assignment.service';

@Component({
  selector: 'assignment-modal-new',
  templateUrl: './assignment-modal.component.html'
})
export class AssignmentModal extends BaseModalComponent {
  @ViewChild('content') content;
  person: any = {};
  assignment: any = {};

  constructor(
    modalService: NgbModal,
    private assignmentService: AssignmentService
  ) {
    super(modalService);
  }

  findAssignment(assignmentId: string) {
    this.assignment = (this.person.assignments || []).find(assignment => assignment._id === assignmentId) || {};
  }

  show(person: any, assignmentId: string) {
    if (typeof person === 'string') {
      this.person = {};
      this.assignmentService.getByLogin(person).subscribe(
        person => {
          this.person = person;
          this.findAssignment(assignmentId);
        },
        err => console.log(err)
      );
    } else {
      this.person = person;
      this.findAssignment(assignmentId);
    }
    this.open();
  }
}