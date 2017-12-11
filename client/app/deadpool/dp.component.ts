import { Component, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BaseComponent } from '../base.component';
import { DpService } from '../services/dp.service';
import { PrintableDatePipe } from '../pipes';
import { Subscription } from 'rxjs';

@Component({
  selector: 'deadpool',
  templateUrl: './dp.component.html'
})
export class DpComponent extends BaseComponent {

  public form = new FormGroup({});
  dates = [];

  constructor(
    private makeDate: PrintableDatePipe,
    private dp: DpService
  ) {
    super(dp);
  }

  getAll(criteria?: any): Subscription {
    return this.dp.getAll(criteria).subscribe(
      data => {
        this.dates = data.reduce((result, item) => {
          let key = this.makeDate.transform(item.date);
          if (!result[key]) {
            result[key] = [];
          }
          result[key].push(item);
          return result;
        }, {});
      },
      error => console.log(error)
    );
  }



  hasDiff(diff: any) {
    return diff.diff !== 1 && diff.diff !== -1;
  }
}