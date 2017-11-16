import { Component, ViewChild, ElementRef } from '@angular/core';

import { SyncService } from '../services/sync.service';


@Component({
  selector: 'sync',
  templateUrl: './sync.component.html'
})
export class SyncComponent {

  @ViewChild('log') logWindow: ElementRef;

  logs = [];
  loadings = {};

  constructor(
    private syncService: SyncService
 ) {
  }

  get isLoading(): boolean {
    return Object.values(this.loadings).some(value => !!value);
  }

  getProgress() {
    return Object.keys(this.loadings);
  }

  private addLog(text: string, source='') {
    this.logs.push((source ? source + ': ' : '') + text);
    if (this.logWindow) {
      this.logWindow.nativeElement.scrollBy(0, 50);
    }
  }

  sync() {
    this.loadings['sync'] = true;
    this.syncService.goOn().subscribe(() => this.loadings['sync'] = false);
  }
}
