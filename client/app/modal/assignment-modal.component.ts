import { Component, ViewChild, Input } from '@angular/core';
import { BaseModalComponent } from './base.component';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { AssignmentService } from '../services/assignment.service';

@Component({
  selector: 'assignment-modal',
  templateUrl: './assignment-modal.component.html'
})
export class AssignmentModal extends BaseModalComponent {
  @ViewChild('content', { static: true }) content;
  person: any = {};
  assignment: any = {};

  constructor(
    modalService: NgbModal,
    private assignmentService: AssignmentService
  ) {
    super(modalService);
  }

  show(person: any, tabName = '') {
    this.person = person;
    this.assignment = person.assignments[0];
    this.open(tabName);
  }
}