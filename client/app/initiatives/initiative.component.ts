import { Component, Input, OnInit } from '@angular/core';

const billable = ['Billable', 'Soft booked', 'PTO Coverage'];

@Component({
  selector: 'initiative',
  templateUrl: './initiative.component.html'
})
export class InitiativeComponent {
  @Input() data: any = {
    color: '',
    name: 'None',
    billability: '',
    imvolvement: 100
  };

  getTitle(): string {
    let involved = this.data.involvement;
    if (involved == 100) involved = '';
    return (this.data.name || 'Job Offer Accepted') + (involved ? ' (' + involved + '%)' : '');
  }

  getStyle(): any {
    return {
      'background-color': this.data.color || '#EEE',
      left: (this.data.offset || 0) + 'px',
      width: this.data.width ? this.data.width + 'px' : 'auto'
    };
  }

  getClass() {
    return {
      nb: !billable.includes(this.data.billability),
      accepted: this.data.billability === 'Job accepted'
    }
  }

  constructor() {
  }
}