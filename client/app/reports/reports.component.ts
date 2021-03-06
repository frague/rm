import { Component, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Subscription, Observable, from } from 'rxjs';

import { AssignmentService } from '../services/assignment.service';
import { InitiativeService } from '../services/initiative.service';
import { ResourceService } from '../services/resource.service';
import { DemandService } from '../services/demand.service';
import { RequisitionService } from '../services/requisition.service';
import { CacheService } from '../services/cache.service';
import { BusService } from '../services/bus.service';

import { Schedule } from '../schedule';

const defaultColumns = {
  name: 'Name',
  grade: 'Grade',
  location: 'Location',
  status: 'Status',
  assignment: 'Assignment'
};

const candidatesQueryKeys = ['requisition', 'candidate'];

const clickabiles = ['name', 'requisitionId'];

@Component({
  selector: 'reports',
  templateUrl: './reports.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsComponent extends Schedule {
  tableColumns = {};
  keys = {};
  isPrintable = false;
  requisitions = {};


  _cache: CacheService;
  private get _allBadges() {
    return this._cache ? this._cache.get('badges') : {};
  }
  private get _itemBadges() {
    return this._cache ? this._cache.get('itemBadges') : {};
  };

  constructor(
    assignmentService: AssignmentService,
    resourceService: ResourceService,
    initiativeService: InitiativeService,
    demandService: DemandService,
    bus: BusService,
    cache: CacheService,
    cd: ChangeDetectorRef,
    private requisitionService: RequisitionService
  ) {
    super(assignmentService, resourceService, initiativeService, demandService, bus, cache, cd);
    this._cache = cache;
  }

  isClickable(name: string): boolean {
    return clickabiles.includes(name);
  }

  getClasses(name: string, resource: any) {
    return {
      clickable: this.isClickable(name),
      name: name === 'name',
      hiree: resource.isHiree
    };
  }

  fetchData(query={}, fetchAll=false, serviceData: any={}): Subscription {
    this.tableColumns = serviceData.columns || defaultColumns;
    this.keys = Object.keys(this.tableColumns);
    query['addComments'] = 1;
    return super.fetchData(query, fetchAll, serviceData);
  }

  postFetch = (query, serviceData={}) => {
    let order = serviceData['order'];
    let queryString = JSON.stringify(query['or']) || '';
    let hideRequisitions = queryString.includes('"requisitions":"false"');
    let hideCandidates = queryString.includes('"candidates":"false"');
    let addBadges = JSON.stringify(serviceData['columns'] || {}).includes('badges');

    let requisitionsQuery = this._cache.getObservable('requisitions') || (
      candidatesQueryKeys.some(key => {
        return queryString.includes(key + '.');
      }) ?
        this.requisitionService.getAll({...query, order}) : from([[]])
    );

    return requisitionsQuery.subscribe(data => {
      this._cache.set('requisitions', data);

      data.slice(0, 100).forEach(requisition => {
        if (!hideRequisitions) {
          requisition.summary = `${requisition.requisitionId} ${requisition.title} (${requisition.jobState})`;
          this.items.push(requisition);
        }
        if (!hideCandidates) {
          requisition.candidates.forEach(candidate => {
            candidate.isHiree = true;
            this.items.push(candidate);
          });
        }
      });
      if (addBadges) {
        this.items.forEach(item => item.badges = (this._itemBadges[item.login] || []).map(id => this._allBadges[id]));
      }
      this.markForCheck();
    });
  };

  getPrintableClass() {
    return {
      printable: this.isPrintable
    };
  }

  setPrintable(state: boolean) {
    this.isPrintable = state;
  }

  click(item, showComments: boolean, column: string, event: MouseEvent = null) {
    if (this.isClickable(column)) {
      let i;
      if (column === 'requisitionId') {
        i = {
          requisitionId: item.requisitionId,
          candidates: true
        };
      } else {
         i = {...item};
      }
      return this.showResource(i, showComments, event);
    }
  }
}
