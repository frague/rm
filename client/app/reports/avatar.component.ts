import { Component, Input } from '@angular/core';
import * as md5 from 'md5';

const loginValidator = new RegExp(/^[a-z]+$/);

@Component({
  selector: 'avatar',
  templateUrl: './avatar.component.html',
})
export class AvatarComponent {
  @Input() login: string;
  @Input() useDefault = false;

  getStyle() {
    let avatar = '';
    if (!this.useDefault && typeof this.login !== 'undefined' && loginValidator.test(this.login)) {
      let url = md5(this.login + '@griddynamics.com');
      // avatar = 'url("https://in.griddynamics.net/service/photos/' + this.login + '.jpg"), ';
      avatar += 'url("https://griddynamics.bamboohr.com/employees/photos/?h=' + url + '"), ';
    }

    return {
      backgroundImage: avatar + 'url("/assets/nophoto.png")'
    };
  }
}