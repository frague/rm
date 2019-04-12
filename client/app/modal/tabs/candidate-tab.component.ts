import { Component, Input } from '@angular/core';
import { BaseTabComponent } from './base.component';

@Component({
  selector: 'candidate-tab',
  templateUrl: './candidate-tab.component.html'
})
export class CandidateTabComponent extends BaseTabComponent {
  @Input() candidate: any = {};
}