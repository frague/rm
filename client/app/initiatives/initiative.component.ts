import { Component, Input, OnInit } from '@angular/core';

const billable = ['Billable', 'Funded'];

@Component({
  selector: 'initiative',
  templateUrl: './initiative.component.html'
})
export class InitiativeComponent implements OnInit {
  @Input() data: any = {
    color: '',
    name: 'None',
    billability: '',
    imvolvement: 100
  };

  getTitle(): string {
    let involved = this.data.involvement;
    if (involved == 100) involved = '';
    return this.data.name + (involved ? ' (' + involved + '%)' : '');
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
      nb: billable.indexOf(this.data.billability) < 0
    }
  }

  constructor() {
  }

  ngOnInit() {
  }
}