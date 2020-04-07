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
      if (this.criteria && this.criteria === filter.filter) {
        this.set(filter);
      }
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
    this.set(filter);
    this.criteria = filter.filter;
    this.parseCriteria(null, true);
  }

  set(filter) {
    this.selectedFilter = filter;
    this.title = filter.title || '';
  }

  reset() {
    this.set({});
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
      let [query, serviceData] = this.filter.parseCriteria(this.criteria, this.timeShift);
      this.query = query;

      this.bus.updateQuery(query, this.criteria, serviceData);
      this.isHelpShown = false;
      return false;
    };
  }

  populate(e: MouseEvent, prefix: string = '') {
    let srcElement = e.srcElement as Element;
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