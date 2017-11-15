import { Component, Output, EventEmitter } from '@angular/core';
import { BusService } from '../services/bus.service';
import { FilterService } from '../services/filter.service';

@Component({
  selector: 'filter',
  templateUrl: './filter.component.html'
})
export class FilterComponent {
  query = {};
  criteria = '';
  selectedFilter: any = {};
  filters = {};
  title = '';

  constructor(
    private bus: BusService,
    private filter: FilterService
  ) {}

  ngOnInit() {
    this.filter.getAll().subscribe(data => this.filters = data.reduce((result, filter) => {
      result[filter._id] = filter;
      return result;
    }, {}));
  }

  getFilters() {
    return Object.values(this.filters);
  }

  save() {
    let newFilter = {title: this.title, filter: this.criteria};
    let operation = this.selectedFilter._id ?
      this.filter.edit(Object.assign(this.selectedFilter, newFilter)) :
      this.filter.add(newFilter);

    operation.subscribe(data => {
      this.filters[data._id] = data;
      this.select(data);
    });
  }

  delete() {
    this.filter.delete(this.selectedFilter).subscribe(() => {
      delete this.filters[this.selectedFilter._id];
      this.reset();
    });
  }

  select(filter) {
    this.selectedFilter = filter;
    this.title = filter.title;
    this.criteria = filter.filter;
    this.parseCriteria(null, filter.filter);
  }

  reset() {
    this.title = '';
    this.selectedFilter = {};
  }

  parseCriteria(event: KeyboardEvent, force=false) {
    event.stopPropagation();
    if (force || event.code === 'Enter') {
      this.query = this.criteria.split(',').reduce((result, pair) => {
        let [param, operation, value]: any[] = pair.replace(/([=~])/g, '\n$1\n').split('\n', 3);

        switch (operation) {
          case '~':
            value = {'$regex': value};
            break;
        }

        let qp = result[param];
        if (qp) {
          if (qp['$in']) {
            qp['$in'].push(value);
          } else {
            result[param] = {'$in': [qp, value]};
          }
        } else {
          result[param] = value;
        }
        return result;
      }, {});

      this.bus.updateQuery(this.query);
      return false;
    };
  }
}