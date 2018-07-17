import { Component } from '@angular/core';
import { BaseTabComponent } from './base.component';

@Component({
  selector: 'user-tab',
  templateUrl: './user-tab.component.html'
})
export class UserTabComponent extends BaseTabComponent {
  person = {};
  hasVisas() {
    return false;
  }
}