import { Component, ViewChild, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { BaseModalComponent } from './base.component';
import { RequisitionService } from '../services/requisition.service';
import { DomSanitizer } from '@angular/platform-browser';
import { jobViteRequisition } from '../consts';

@Component({
  selector: 'requisition-modal',
  templateUrl: './requisition-modal.component.html'
})
export class RequisitionModal extends BaseModalComponent {
  isLarge = true;
  @ViewChild('content') content;
  requisition: any = {};
  error = false;

  constructor(
    modalService: NgbModal,
    private requisitionService: RequisitionService,
    private sanitizer: DomSanitizer,
  ) {
    super(modalService);
  }

  showError(data) {
    this.error = true;
    this.requisition = {
      requisitionId: data,
      title: `Failed to fetch requisition data`
    };
  }

  show(requisition: any, tabName = ''): Subject<any> {
    this.error = false;
    if (typeof requisition === 'string') {
      this.requisitionService.get(requisition)
        .subscribe(
          data => {
            if (!data || !data.requisitionId) {
              this.showError(requisition);
            } else {
              this.requisition = data;
            }
          },
          error => {
            console.log(error);
            this.error = true;
            this.showError(requisition);
          }
        );
    } else {
      this.requisition = requisition;
    }
    return this.open(tabName);
  }

  getClass(state: string) {
    return {
      'Open': 'fa-search',
      'Draft': 'fa-pencil',
      'Awaiting Approval': 'fa-clock-o',
      'On-hold': 'fa-pause',
      'Filled': 'fa-check',
    }[state];
  }

  getJvRequisitionLink() {
    return this.sanitizer.bypassSecurityTrustUrl(jobViteRequisition + this.requisition.eId);
  }

}