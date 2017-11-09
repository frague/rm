import { Component, Output, EventEmitter } from '@angular/core';
import { BusService } from '../services/bus.service';

@Component({
  selector: 'filter',
  templateUrl: './filter.component.html'
})
export class FilterComponent {
  timer = null;

  constructor(private bus: BusService) {}

  parseCriteria(event: KeyboardEvent) {
    let criteria = event.srcElement['value'];
    let query = criteria.split(',').reduce((result, pair) => {
      let [param, operation, value] = pair.replace(/([=~])/g, '\n$1\n').split('\n', 3);

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
    // console.log(query);

    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.bus.updateQuery(query);
    }, 2000);
  }
}