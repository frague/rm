import { Component, ViewChild, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { BaseModalComponent } from './base.component';
import { DemandService } from '../services/demand.service';

const closedStates = ['Filled', 'Closed', 'Cancelled', 'On hold'];
const states = {
  true: 'Active',
  false: 'Inactive'
};
const pmoDemandUrl = 'https://pmo.griddynamics.net/dashboard/position/demand/view.action?cs_id=';

@Component({
  selector: 'demand-modal',
  templateUrl: './demand-modal.component.html'
})
export class DemandModal extends BaseModalComponent {
  isLarge = true;
  @ViewChild('content') content;
  demand: any = {};
  requisitionDiff = null;
  notFound = false;

  constructor(
    modalService: NgbModal,
    private demandService: DemandService,
  ) {
    super(modalService);
  }

  show(demand: any, tabName = '', diff = null): Subject<any> {
    this.requisitionDiff = diff;

    this.notFound = false;
    if (typeof demand === 'string') {
      this.isLoading = true;
      this.demandService.get({_id: demand})
        .subscribe(
          result => {
            if (result) {
              this.demand = result;
            } else {
              this.notFound = true;
              this.demand = result || {
                login: demand,
                stage: 'X',
                profile: 'a requisition'
              }
            }
          },
          error => console.log(error)
        )
        .add(() => this.isLoading = false);
    } else {
      this.demand = demand;
    }
    return this.open(tabName);
  }

  getId() {
    let [num, ] = (this.demand.login || '_').split('_');
    return num;
  }

  getPmoLink() {
    let id = this.getId();
    return id ? pmoDemandUrl + id : null;
  }
}