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

  public get assignee(): any {
    return this.resources[this.assignment.resourceId] || {};
  }

  public get initiative(): any {
    return this.initiatives[this.assignment.initiativeId] || {};
  }

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

  getAssigneeName(): string {
    return this.assignee.name ? this.assignee.name + ' (' + this.assignee.grade + ', ' + this.assignee.location + ')' : '';
  }

  getAssigneeProfile() {
    return this.assignee.profile ? this.assignee.profile + ' (' + this.assignee.specialization + ')' : '';
  }

}