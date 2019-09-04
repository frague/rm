import { Injectable, EventEmitter } from '@angular/core';
import { map } from 'rxjs/operators';

@Injectable()
export class LoaderService {
  private _loaders = {};
  private _startTime = null;
  private _ticker;

  updated: EventEmitter<any> = new EventEmitter();

  constructor() {}

  get isLoading(): boolean {
    return this.threadsInProgress > 0;
  }

  get threadsInProgress(): number {
    return Object.keys(this._loaders).length;
  }

  get loadingTime(): string {
    if (!this._startTime) {
      return '-';
    }
    let now = new Date();
    return Math.round(this._getIntervalInSec(this._startTime)).toString();
  }

  private _getIntervalInSec(from: Date): number {
    let now = new Date();
    return (now.getTime() - from.getTime()) / 1000;
  }

  private _tick() {
    this.updated.emit(this.loadingTime);
  }

  start(id = null): string {
    let now = new Date();
    if (!this.isLoading) {
      this._startTime = now;
      this._ticker = setInterval(() => this._tick(), 1000);
    }
    id = id || `_id${('' + Math.random()).substr(2, 15)}`;
    this._loaders[id] = now;
    return id;
  }

  complete(id: string): number {
    let started = this._loaders[id];
    if (!started) {
      return -1;
    }
    let now = new Date();
    delete this._loaders[id];
    if (!this.isLoading) {
      this._startTime = null;
      clearInterval(this._ticker);
      this._tick();
    }
    return this._getIntervalInSec(started);
  }
}