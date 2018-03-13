import { Component, ViewChild, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { RequisitionService } from '../services/requisition.service';

@Component({
  selector: 'requisition-modal',
  templateUrl: './requisition.component.html'
})
export class RequisitionComponent {
  @ViewChild('content') content;
  
  requisition: any = {};
  public isFetching: boolean = false;

  constructor(private modalService: NgbModal, private requisitionService: RequisitionService) {}

  show(requisition: any) {
    if (typeof requisition === 'string') {
      this.isFetching = true;
      this.requisition = {};
      this.requisitionService.get(requisition).subscribe(
        requisition => {
          this.requisition = requisition;
          this.isFetching = false;
        }, 
        error => {
          console.log('Error fetching requisition', requisition);
          this.isFetching = false;
        }
      );
    } else {
      this.requisition = requisition;
    }
    this.modalService.open(this.content);
  }
}