import { EventEmitter } from '@angular/core';

export class BusService {
  filterQuery = {};
  criteria = '';

  public filterUpdated: EventEmitter<any> = new EventEmitter();
  public criteriaUpdated: EventEmitter<string> = new EventEmitter();

  updateQuery(query: any, criteria: string) {
    this.criteria = criteria;
    this.filterQuery = query;
    this.filterUpdated.emit(query);
  }
}