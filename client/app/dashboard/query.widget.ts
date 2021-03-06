import { Component, Input } from '@angular/core';
import { of, zip, Observable, Subscription } from 'rxjs';
import { AssignmentService } from '../services/assignment.service';
import { ResourceService } from '../services/resource.service';
import { CandidateService } from '../services/candidate.service';
import { DemandService } from '../services/demand.service';
import { FilterService } from '../services/filter.service';

const defaultColumns = {
  name: 'Name',
  grade: 'Grade',
  status: 'Status'
};

@Component({
  selector: 'query-widget',
  templateUrl: './query.widget.html'
})
export class QueryWidget {
  @Input() criteria: string = '';
  @Input() title: string = 'Query widget';
  @Input() limit: number = 30;

  items: any[] = [];
  services = {};
  tableColumns = {};
  keys = {};

  assignments = [];
  candidates = [];
  demands = [];
  resources = [];

  constructor(
    assignmentsService: AssignmentService,
    candidatesService: CandidateService,
    demandsService: DemandService,
    resourcesService: ResourceService,
    private filters: FilterService
  ) {
    this.services = {
      assignments: assignmentsService,
      candidates: candidatesService,
      demands: demandsService,
      resources: resourcesService,
    };
  }

  ngOnInit() {
    return this.fetchData()
      .then((data: any[]) => {
        this.items = this.postFetch(data);
      });
  }

  fetchData(): Promise<any[]> {
    let fetchAll = this.criteria.includes('comments');
    let query, serviceData: any={};
    [query, serviceData] = this.filters.parseCriteria(this.criteria + `,limit=${this.limit}`);

    this.tableColumns = serviceData.columns || defaultColumns;
    this.keys = Object.keys(this.tableColumns);
    query['addComments'] = 1;

    return new Promise((resolve, reject) => zip(...Object.keys(this.services)
      .sort()
      .map(serviceName => ((fetchAll || serviceName === 'resources') ? this.services[serviceName].getAll(query) : of([])))
    )
      .subscribe(([assignments, candidates, demands, resources]) => {
        // combine resources with assignments here
        resolve([].concat(resources, candidates, demands));
      }, error => reject(error))
    );
  }

  postFetch(data: any[]): any[] {
    return data;
  }

  getLineClass(item): string|object {
    return '';
  }
}