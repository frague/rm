import { Component, ViewChild, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { DemandService } from '../services/demand.service';

const month = 60 * 60 * 24 * 30 * 1000;

@Component({
  selector: 'demand-modal',
  templateUrl: './demand.component.html'
})
export class DemandComponent {
  @ViewChild('content') content;
  demand: any = {};
  isLoading = false;

  constructor(
    private modalService: NgbModal,
    private demandService: DemandService
  ) {}

  show(demand: any) {
    if (typeof demand === 'string') {
      this.isLoading = true;
      this.demandService.get({_id: demand}).subscribe(
        demand => this.demand = demand,
        error => console.log(error)
      ).add(() => this.isLoading = false);
    } else {
      this.demand = demand;
    }
    this.modalService.open(this.content);
  }

  datesDiff(): string {
    if (!this.demand.start || !this.demand.end) return '';
    let s = new Date(this.demand.start).getTime();
    let e = new Date(this.demand.end).getTime();
    return '(' + Math.floor((e - s) / month) + 'm)';
  }
}