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

  show(person: any) {
    this.person = person;
    this.assignment = person.assignments[0];
    this.open();
  }
}