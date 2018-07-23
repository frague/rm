import { Component, Input, EventEmitter } from '@angular/core';
import { BaseTabComponent } from './base.component';

@Component({
  selector: 'assignment-tab',
  templateUrl: './assignment-tab.component.html'
})
export class AssignmentTabComponent extends BaseTabComponent {
  @Input() assignment: any = {};
}