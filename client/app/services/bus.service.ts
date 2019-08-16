import { EventEmitter } from '@angular/core';

export type IEditedContent = {
  source: string,
  text: string,
  isStatus: boolean
};

export class BusService {
  filterQuery = {};
  criteria = '';
  serviceData = {};

  public filterUpdated: EventEmitter<any> = new EventEmitter();
  public criteriaUpdated: EventEmitter<string> = new EventEmitter();
  public timeShiftUpdated: EventEmitter<number> = new EventEmitter();

  public badgeUpdated: EventEmitter<string> = new EventEmitter();

  public editedContent: EventEmitter<{data: IEditedContent, resolve: Function, reject: Function}> = new EventEmitter();

  updateQuery(query: any, criteria: string, serviceData = {}) {
    this.criteria = criteria;
    this.filterQuery = query;
    this.serviceData = serviceData;
    this.filterUpdated.emit([query, serviceData]);
  }

  showEditor(data: IEditedContent): Promise<IEditedContent> {
    return new Promise((resolve, reject) => this.editedContent.emit({data, resolve, reject}));
  }
}