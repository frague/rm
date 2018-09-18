import { EventEmitter } from '@angular/core';

export class BusService {
  filterQuery = {};
  criteria = '';
  serviceData = {};

  public filterUpdated: EventEmitter<any> = new EventEmitter();
  public criteriaUpdated: EventEmitter<string> = new EventEmitter();
  public timeShiftUpdated: EventEmitter<number> = new EventEmitter();

  updateQuery(query: any, criteria: string, serviceData = {}) {
    this.criteria = criteria;
    this.filterQuery = query;
    this.serviceData = serviceData;
    this.filterUpdated.emit([query, serviceData]);
  }
}