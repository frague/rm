import { EventEmitter } from '@angular/core';

export class BusService {
  filterQuery = {demand: 'true'};

  public filterUpdated: EventEmitter<any> = new EventEmitter();

  updateQuery(query: any) {
    this.filterQuery = query;
    this.filterUpdated.emit(query);
  }
}