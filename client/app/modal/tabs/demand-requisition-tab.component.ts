import { Component, Input, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription, Subject } from 'rxjs';
import { BaseTabComponent } from './base.component';
import { PrintableDatePipe } from '../../pipes';
import { CommentService} from '../../services/comments.service';

const isDate = new RegExp(/^[12]\d{3}\-/);

@Component({
  selector: 'demand-requisition-tab',
  templateUrl: './demand-requisition-tab.component.html'
})
export class DemandRequisitionTabComponent extends BaseTabComponent {
  @Input() comparison = null;
}