import { Component, ViewChild, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { BaseModalComponent } from './base.component';
import { RequisitionService } from '../services/requisition.service';

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
      this.isLoading = true;
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
        )
        .add(() => this.isLoading = false);
    } else {
      this.requisition = requisition;
    }
    return this.open(tabName);
  }
}