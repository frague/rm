import { Component, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BaseComponent } from '../base.component';
import { DpService } from '../services/dp.service';
import { PrintableDatePipe } from '../pipes';
import { Subscription, Observable } from 'rxjs';

@Component({
  selector: 'deadpool',
  templateUrl: './dp.component.html'
})
export class DpComponent extends BaseComponent {

  public form = new FormGroup({});
  types = ['r', 'd', 'c'];

  typeNames = {r: 'Resources', d: 'Demands', c: 'Candidates'};
  diffs = {};

  constructor(
    private makeDate: PrintableDatePipe,
    private dp: DpService
  ) {
    super(dp);
    this.reset();
  }

  reset() {
    this.diffs = this.types.reduce((result, type) => {
      result[type] = {};
      return result
    }, {});
  }

  getAll(criteria: any = {}): Subscription {
    this.reset();
    return Observable.forkJoin(this.types.map(type => {
      let query = Object.assign({type}, criteria);
      return this.dp.getAll(query);
    })).subscribe(
      diffs => {
        [].concat(...diffs).forEach(diff => {
          let key = this.makeDate.transform(diff.date);
          let byType = this.diffs[diff.type];
          if (!byType[key]) {
            byType[key] = [];
          }
          byType[key].push(diff);

        });
      },
      error => console.log(error)
    );
  }

  getDatesFor(type: string) {
    return Object.keys(this.diffs[type]);
  }

  hasDiff(diff: any) {
    return diff.diff !== 1 && diff.diff !== -1;
  }
}