import { Component, EventEmitter } from '@angular/core';
import { BusService } from '../services/bus.service';
import { FilterService } from '../services/filter.service';

const serviceKeys = ['columns', 'order', 'group'];

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
  $externalTimeShift;
  isHelpShown = false;

  timeShift = 0;

  constructor(
    private bus: BusService,
    private filter: FilterService
  ) {
    this.criteria = this.bus.criteria;
  }

  ngOnInit() {
    this.filter.getAll().subscribe(data => this.filters = data.reduce((result, filter) => {
      result[filter._id] = filter;
      return result;
    }, {}));
    this.$externalCriteria = this.bus.criteriaUpdated.subscribe(criteria => {
      this.criteria = criteria;
      this.parseCriteria(null, true);
      if (this.selectedFilter._id && this.criteria !== this.selectedFilter.filter) {
        this.reset();
      }
    });
    this.$externalTimeShift = this.bus.timeShiftUpdated.subscribe((shift: number) => this.setTimeShift(shift));
  }

  ngOnDestroy() {
    [this.$externalCriteria, this.$externalTimeShift].forEach($s => $s.unsubscribe());
  }

  getFilters() {
    return Object.values(this.filters);
  }

  toggleHelp(state=null) {
    this.isHelpShown = state === null ? !this.isHelpShown : state;
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

  clear() {
    this.criteria = '';
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

  _parseParam(name: string, value: string = '') {
    switch (name) {
      case'columns':
        return value.split('|').reduce((result, value) => {
          let [param, alias] = value.split(' as ');
          result[param] = alias || param;
          return result;
        }, {});
      case 'order':
        return value.split('|').reduce((result, value) => {
          let order = 1;
          if (value && value.charAt(0) === '-') {
            order = -1;
          }
          value = value.replace(/^[+\-]/, '');
          result.push(value + ':' + order);
          return result;
        }, []).join(',');
    }
    return true;
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
      let serviceData = {
        'shift': this.timeShift
      };

      if (this.criteria) {
        this.criteria.split(',').forEach(pair => {
          let [param, operation, value]: any[] = pair.replace(/([+!]{0,1}[=~])/g, '\n$1\n').split('\n', 3);
          if (!operation && !value) {
            [param, operation, value] = ['name', '~', param];
          }
          if (serviceKeys.includes(param)) {
            serviceData[param] = this._parseParam(param, value);
          } else {
            let addition = false;
            // let regexValue = {'$regex': value, '$options': 'i'};
            let regexValue = `/${value}/i`;
            switch (operation) {
              case '+~':
                addition = true;
              case '~':
                value = {[param]: regexValue};
                break;
              case '+=':
                addition = true;
                value = {[param]: value};
                break;
              // case '!~':
              //   value = {[param]: {'$nin': [regexValue]}};
              //   break;
              case '!=':
                value = {[param]: {'$ne': value}};
                break;
              case '=':
                if (!inOperator[param]) {
                  inOperator[param] = [];
                }
                inOperator[param].push(value);
                return;
            }
            (addition ? orOperator : andOperator).push(value);
          }
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
      this.bus.updateQuery(this.query, this.criteria, serviceData);
      this.isHelpShown = false;
      return false;
    };
  }

  populate(e: MouseEvent, prefix: string = '') {
    let srcElement = e.srcElement;
    if (srcElement && srcElement.tagName === 'LI') {
      let appendix = (prefix ? prefix + '.' : '') + srcElement['innerText'];
      this.criteria += (!this.criteria || this.criteria.endsWith(',') ? '' : ',') + appendix;
    }
  }

  setTimeShift(shift: number) {
    this.timeShift = shift;
    this.parseCriteria(null, true);
  }
}