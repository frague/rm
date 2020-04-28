import { EventEmitter, Injectable } from '@angular/core';

export type IEditedContent = {
  source: string,
  text: string,
  isStatus: boolean
};

export type IUserModal = {
  entity: any,
  tab?: string,
  callback?: Function
};

@Injectable()
export class BusService {
  filterQuery = {};
  criteria = '';
  serviceData = {};

  public filterUpdated: EventEmitter<any> = new EventEmitter();
  public criteriaUpdated: EventEmitter<string> = new EventEmitter();
  public timeShiftUpdated: EventEmitter<number> = new EventEmitter();

  public reloadBadges: EventEmitter<any> = new EventEmitter();
  public badgeUpdated: EventEmitter<string> = new EventEmitter();
  public dbUpdated: EventEmitter<string> = new EventEmitter();

  public editedContent: EventEmitter<{data: IEditedContent, resolve: Function, reject: Function}> = new EventEmitter();
  public showPerson: EventEmitter<IUserModal> = new EventEmitter();

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