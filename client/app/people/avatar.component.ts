import { Component, Input } from '@angular/core';

const loginValidator = new RegExp(/^[a-z]+$/);

@Component({
  selector: 'avatar',
  templateUrl: './avatar.component.html',
})
export class AvatarComponent {
  @Input() login: string;
  @Input() useDefault = false;

  getStyle() {
    let avatar = (!!this.useDefault || typeof this.login === 'undefined' || !loginValidator.test(this.login)) ?
    '' : 'url("https://in.griddynamics.net/service/photos/' + this.login + '.jpg"), ';

    return {
      backgroundImage: avatar + 'url("/assets/nophoto.png")'
    };
  }
}