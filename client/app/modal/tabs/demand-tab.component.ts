import { Component, Input, EventEmitter } from '@angular/core';
import { BaseTabComponent } from './base.component';

const month = 60 * 60 * 24 * 30 * 1000;

@Component({
  selector: 'demand-tab',
  templateUrl: './demand-tab.component.html'
})
export class DemandTabComponent extends BaseTabComponent {
  @Input() demand: any = {};

  datesDiff(): string {
    if (!this.demand.start || !this.demand.end) return '';
    let s = new Date(this.demand.start).getTime();
    let e = new Date(this.demand.end).getTime();
    return '(' + Math.floor((e - s) / month) + 'm)';
  }
}