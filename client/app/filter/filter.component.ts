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
  $externalCriteria;

  constructor(
    private bus: BusService,
    private filter: FilterService
  ) {}

  ngOnInit() {
    this.filter.getAll().subscribe(data => this.filters = data.reduce((result, filter) => {
      result[filter._id] = filter;
      return result;
    }, {}));
    this.$externalCriteria = this.bus.criteriaUpdated.subscribe(criteria => {
      this.criteria = criteria;
      this.parseCriteria(null, true);
    });
  }

  ngOnDestroy() {
    this.$externalCriteria.unsubscribe();
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
    this.parseCriteria(null, true);
  }

  reset() {
    this.title = '';
    this.selectedFilter = {};
  }

  parseCriteria(event: KeyboardEvent, force=false) {
    if (event) {
      event.stopPropagation();
      if (event.code === 'Escape') {
        this.criteria = '';
        return;
      }
      if (event.code === 'Enter') {
        force = true;
      }
    }

    if (force) {
      let andOperator = [];
      let orOperator = [];
      let inOperator = {};
      if (this.criteria) {
        this.criteria.split(',').forEach(pair => {
          let [param, operation, value]: any[] = pair.replace(/(\+{0,1}[=~])/g, '\n$1\n').split('\n', 3);

          let addition = false;
          switch (operation) {
            case '+~':
              addition = true;
            case '~':
              value = {[param]: {'$regex': value}};
              break;
            case '+=':
              addition = true;
              value = {[param]: value};
              return;
            case '=':
              if (!inOperator[param]) {
                inOperator[param] = [];
              }
              inOperator[param].push(value);
              return;
          }
          (addition ? orOperator : andOperator).push(value);
        });

        Object.keys(inOperator).forEach(key => {
          let values = inOperator[key];
          if (values.length > 1) {
            andOperator.push({[key]: {'$in': inOperator[key]}});
          } else {
            andOperator.push({[key]: values[0]});
          }
        });

        orOperator.push({'$and': andOperator});
        this.query = orOperator.length ? {'or': orOperator} : {};
      } else {
        this.query = {or: []};
      }

      this.bus.updateQuery(this.query, this.criteria);
      return false;
    };
  }
}