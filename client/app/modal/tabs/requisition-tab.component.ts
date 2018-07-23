import { Component, Input, EventEmitter } from '@angular/core';
import { BaseTabComponent } from './base.component';
import { DomSanitizer } from '@angular/platform-browser';
import { jobViteRequisition } from '../../consts';

@Component({
  selector: 'requisition-tab',
  templateUrl: './requisition-tab.component.html'
})
export class RequisitionTabComponent extends BaseTabComponent {
  @Input() requisition: any = {};

  constructor(private sanitizer: DomSanitizer) {
    super();
  }

  getJvRequisitionLink(requisition) {
    return this.sanitizer.bypassSecurityTrustUrl(jobViteRequisition + requisition.eId);
  }
}