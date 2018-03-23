import { Component, ViewChild, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { RequisitionService } from '../services/requisition.service';
import { DomSanitizer } from '@angular/platform-browser';
import { jobViteRequisition } from '../consts';

@Component({
  selector: 'requisition-modal',
  templateUrl: './requisition.component.html'
})
export class RequisitionComponent {
  @ViewChild('content') content;

  requisition: any = {};
  public isLoading: boolean = false;

  constructor(
    private modalService: NgbModal,
    private sanitizer: DomSanitizer,
    private requisitionService: RequisitionService
  ) {}

  show(requisition: any) {
    if (typeof requisition === 'string') {
      this.isLoading = true;
      this.requisition = {};
      this.requisitionService.get(requisition).subscribe(
        requisition => {
          this.requisition = requisition;
          this.isLoading = false;
        },
        error => {
          console.log('Error fetching requisition', requisition);
          this.isLoading = false;
        }
      );
    } else {
      this.requisition = requisition;
    }
    this.modalService.open(this.content);
  }

  getJvRequisitionLink(requisition) {
    return this.sanitizer.bypassSecurityTrustUrl(jobViteRequisition + requisition.eId);
  }
}