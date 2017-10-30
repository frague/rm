import { Component, ViewChild, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { FormControl, FormGroup, Validators } from '@angular/forms';

type assignmentType = {
  resourceId: string,
  initiativeId: string,
  start: string,
  end: [string],
  billability: string,
  ivolvement: number,
  comments: string
};

@Component({
  selector: 'assignment-modal',
  templateUrl: './assignment.component.html'
})
export class AssignmentComponent {
  @ViewChild('content') content;
  @Input() resources: any[] = [];
  @Input() initiatives: any = {};

  assignment: assignmentType = {} as assignmentType;

  public form = new FormGroup({
    _id: new FormControl(''),
    resourceId: new FormControl('', Validators.required),
    initiativeId: new FormControl('', Validators.required),
    start: new FormControl('', Validators.required),
    end: new FormControl('', Validators.required),
    billability: new FormControl('', Validators.required),
    involvement: new FormControl('100', Validators.required),
    comment: new FormControl('')
  });

constructor(private modalService: NgbModal) {}

  getInitiatives() {
    return Object.values(this.initiatives);
  }

  show(assignment: any) {
    this.assignment = assignment;
    this.form.setValue(assignment);
    this.modalService.open(this.content);
  }

}