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
    let assignments = this.person.assignments || [];
    this.assignment = assignments.find(assignment => assignment._id === assignmentId);
    if (!this.assignment) {
      this.assignment = assignments.length ? assignments[0] : {};
    }
  }

  show(person: any, assignmentId: string) {
    if (typeof person === 'string') {
      this.person = {};
      this.isLoading = true;
      this.assignmentService.getByLogin(person)
        .subscribe(
          person => {
            this.person = person;
            this.findAssignment(assignmentId);
          },
          err => console.log(err)
        )
      	.add(() => this.isLoading = false);
    } else {
      this.person = person;
      this.findAssignment(assignmentId);
    }
    this.open();
  }
}