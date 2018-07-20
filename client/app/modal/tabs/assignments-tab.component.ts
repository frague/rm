import { Component, Input, EventEmitter } from '@angular/core';
import { BaseTabComponent } from './base.component';
import { DomSanitizer } from '@angular/platform-browser';
import { PrintableDatePipe } from '../../pipes';

@Component({
  selector: 'assignments-tab',
  templateUrl: './assignments-tab.component.html'
})
export class AssignmentsTabComponent extends BaseTabComponent {
  @Input() person: any = {};
  @Input('assignment') shownAssignment: any = {};

  constructor(
    public sanitizer: DomSanitizer,
    private makeDate: PrintableDatePipe,
  ) {
    super();
  }

  select(assignment: any) {
    this.shownAssignment = assignment;
  }

  getAssignmentClass(assignment: any): Object {
    return {
      selected: assignment._id === this.shownAssignment._id
    };
  }
}