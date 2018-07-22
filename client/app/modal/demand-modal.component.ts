import { Component, ViewChild, Input } from '@angular/core';
import { BaseModalComponent } from './base.component';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { DemandService } from '../services/demand.service';

@Component({
  selector: 'demand-modal-new',
  templateUrl: './demand-modal.component.html'
})
export class DemandModal extends BaseModalComponent {
  isLarge = true;
  @ViewChild('content') content;
  demand: any = {};

  constructor(
    modalService: NgbModal,
    private demandService: DemandService,
  ) {
    super(modalService);
  }

  show(demand: any) {
    if (typeof demand === 'string') {
      this.isLoading = true;
      this.demandService.get({_id: demand})
        .subscribe(
          demand => this.demand = demand || {},
          error => console.log(error)
        )
        .add(() => this.isLoading = false);
    } else {
      this.demand = demand;
    }
    this.open();
  }

  getId() {
    let [num, ] = (this.demand.login || '_').split('_');
    return num;
  }
}