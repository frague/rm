import { Component, Input, EventEmitter } from '@angular/core';
import { BaseTabComponent } from './base.component';
import { DpService } from '../../services/dp.service';

@Component({
  selector: 'history-tab',
  templateUrl: './history-tab.component.html'
})
export class HistoryTabComponent extends BaseTabComponent {
  @Input() key: any = {};
  items: any[] = [];

  constructor(
    private dpService: DpService,
  ) {
    super();
  }

  fetchData() {
    this.items = [];
    if (!this.key) return;

    this.isLoading = true;
  	this.dpService.getAll({subject: this.key})
      .subscribe(diffs => this.items = diffs)
      .add(() => this.isLoading = false);
  }
}