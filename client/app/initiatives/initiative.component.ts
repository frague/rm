import { Component, Input, OnInit } from '@angular/core';

const billable = ['Billable', 'Funded'];

@Component({
  selector: 'initiative',
  template: '<i class="initiative" [ngClass]="getClass()" [ngStyle]="getStyle()" [title]="data.account">{{ data.name }}</i>'
})
export class InitiativeComponent implements OnInit {
  @Input() data: any = {
    color: '',
    name: 'None',
    billability: ''
  };

  public getStyle(): any {
    return {
      'background-color': this.data.color || '#EEE',
      left: (this.data.offset || 0) + 'px',
      width: this.data.width ? this.data.width + 'px' : 'auto'
    };
  }

  public getClass() {
    return {
      nb: billable.indexOf(this.data.billability) < 0
    }
  }

  constructor() {
  }

  ngOnInit() {
  }
}