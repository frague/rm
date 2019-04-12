import { Component, Input, EventEmitter } from '@angular/core';
import { BaseTabComponent } from './base.component';

@Component({
  selector: 'requisition-tab',
  templateUrl: './requisition-tab.component.html'
})
export class RequisitionTabComponent extends BaseTabComponent {
  @Input() requisition: any = {};
}