import { Component, ViewChild, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

const month = 60*60*24*30*1000;

@Component({
  selector: 'demand-modal',
  templateUrl: './demand.component.html'
})
export class DemandComponent {
  @ViewChild('content') content;
  demand: any;

  constructor(private modalService: NgbModal) {}

  show(demand: any) {
    this.demand = demand;
    console.log(demand);
    this.modalService.open(this.content);
  }

  datesDiff(): string {
    if (!this.demand.start || !this.demand.end) return '';
    let s = new Date(this.demand.start).getTime();
    let e = new Date(this.demand.end).getTime();
    return '(' + Math.floor((e - s) / month) + 'm)';
  }
}