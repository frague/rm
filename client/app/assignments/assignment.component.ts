import { Component, ViewChild, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'assignment-modal',
  templateUrl: './assignment.component.html'
})
export class AssignmentComponent {
  @ViewChild('content') content;
  @Input() resources: any[] = [];
  @Input() initiatives: any = {};

  assignment: any;

  constructor(private modalService: NgbModal) {}

  getInitiatives() {
    return Object.values(this.initiatives);
  }

  show(assignment: any) {
    this.assignment = assignment;
    console.log(assignment);
    this.modalService.open(this.content);
  }

  getAssignee(): any {
    return this.resources[this.assignment.resourceId] || {};
  }

  getAssigneeName(): string {
    let assignee = this.getAssignee();
    return assignee ? assignee.name : '-';
  }

  getInitiative(): any {
    return this.initiatives[this.assignment.initiativeId] || {};
  }

}