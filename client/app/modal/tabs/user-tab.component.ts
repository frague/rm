import { Component, Input, EventEmitter } from '@angular/core';
import { BaseTabComponent } from './base.component';
import { DomSanitizer } from '@angular/platform-browser';
import { PrintableDatePipe } from '../../pipes';

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
    return this.person.visaB || this.person.visaL;
  }

  getVisaInfo(key: string, title: string) {
    let till = this.person[key];
    if (till) {
      return title + ' till ' + this.makeDate.transform(till);
    }
    return '';
  }

  getSkype() {
    return this.person.skype ?
      this.sanitizer.bypassSecurityTrustUrl('skype:' + this.person.skype + '?chat') :
      '';
  }

  getEmail() {
    let login = this.person.login;
    return login && login.indexOf(' ') < 0 ?
      this.sanitizer.bypassSecurityTrustUrl('mailto:' + this.person.login + '@griddynamics.com'):
      '';
  }
}