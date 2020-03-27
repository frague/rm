import { Component, Input, EventEmitter } from '@angular/core';
import { BaseTabComponent } from './base.component';
import { DomSanitizer } from '@angular/platform-browser';
import { PrintableDatePipe } from '../../pipes';

const now = new Date();

@Component({
  selector: 'user-tab',
  templateUrl: './user-tab.component.html'
})
export class UserTabComponent extends BaseTabComponent {
  @Input() person: any = {};

  constructor(
    public sanitizer: DomSanitizer,
    private makeDate: PrintableDatePipe,
  ) {
    super();
  }

  hasVisas() {
    return this.person.visas && this.person.visas.length;
  }

  isExpired(date) {
    return (date && new Date(date) < now);
  }

  getSkype() {
    return this.person.skype ?
      this.sanitizer.bypassSecurityTrustUrl('skype:' + this.person.skype + '?chat') :
      '';
  }

  copy() {
    const el = document.createElement('textarea');
    el.value = this.person.CV;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
}