import { Component, Input, EventEmitter } from '@angular/core';
import { BaseTabComponent } from './base.component';
import { DomSanitizer } from '@angular/platform-browser';
import { PrintableDatePipe } from '../../pipes';
import { AssignmentService } from '../../services/assignment.service';

@Component({
  selector: 'assignments-tab',
  templateUrl: './assignments-tab.component.html'
})
export class AssignmentsTabComponent extends BaseTabComponent {
  @Input() pmoId: string = '';
  @Input() state: any = {};
  items: any[] = [];
  now: string = '';

  constructor(
    private assignmentService: AssignmentService,
    private makeDate: PrintableDatePipe
  ) {
    super();
  }

  fetchData() {
    this.now = this.makeDate.transform(new Date(), 'ten');
    this.items = this.getState('assignments', this.pmoId);
    if (this.items && this.items.length) {
      return;
    }

    this.isLoading = true;
  	this.assignmentService.get({_id: this.pmoId})
      .subscribe(data => {
        this.items = data;
        console.log(data);
        this.setState('assignments', this.pmoId, data);
      })
      .add(() => this.isLoading = false);
  }

  getClass(assignment) {
    return {
      active: assignment.start <= this.now && (!assignment.finish || assignment.finish >= this.now)
    }
  }
}