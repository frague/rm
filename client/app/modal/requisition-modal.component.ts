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

  constructor(
    modalService: NgbModal,
    private requisitionService: RequisitionService,
  ) {
    super(modalService);
  }

  show(requisition: any, tabName = ''): Subject<any> {
    if (typeof requisition === 'string') {
      this.isLoading = true;
      this.requisitionService.get(requisition)
        .subscribe(
          requisition => this.requisition = requisition || {},
          error => console.log(error)
        )
        .add(() => this.isLoading = false);
    } else {
      this.requisition = requisition;
    }
    return this.open(tabName);
  }
}