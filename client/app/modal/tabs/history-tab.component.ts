import { Component, Input, EventEmitter } from '@angular/core';
import { BaseTabComponent } from './base.component';
import { DpService } from '../../services/dp.service';

@Component({
  selector: 'history-tab',
  templateUrl: './history-tab.component.html'
})
export class HistoryTabComponent extends BaseTabComponent {
  @Input() key: any = {};
  @Input() state: any = {};
  items: any[] = null;

  constructor(
    private dpService: DpService,
  ) {
    super();
  }

  fetchData() {
    this.items = this.getState('history', this.key);
    if (!this.key || (this.items && this.items.length)) {
      return;
    }

  	this.dpService.getAll({subject: this.key})
      .subscribe(diffs => {
        this.items = diffs;
        this.setState('history', this.key, diffs);
      });
  }
}