import { Component, Input, OnInit } from '@angular/core';
import { Utils } from '../utils';

@Component({
  selector: 'initiative',
  templateUrl: './initiative.component.html'
})
export class InitiativeComponent {
  @Input() data: any = {
    color: '',
    name: 'None',
    billable: false,
    imvolvement: 100,
    isAcceptor: false
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
      nb: !Utils.isTrue(this.data.billable),
      accepted: this.data.isAcceptor
    }
  }

  constructor() {
  }
}