import { Component, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BaseComponent } from '../base.component';
import { DpService } from '../services/dp.service';

@Component({
  selector: 'deadpool',
  templateUrl: './dp.component.html'
})
export class DpComponent extends BaseComponent {

  public form = new FormGroup({});
  items = [];

  constructor(private dp: DpService) {
    super(dp);
  }

  hasDiff(diff: any) {
    return diff.diff !== 1 && diff.diff !== 1;
  }
}