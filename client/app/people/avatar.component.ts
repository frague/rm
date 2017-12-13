import { Component, Input } from '@angular/core';

@Component({
  selector: 'avatar',
  templateUrl: './avatar.component.html'
})
export class AvatarComponent {
  @Input() login: string;

  getStyle() {
    return {
      backgroundImage: 'url("https://in.griddynamics.net/service/photos/' + this.login + '.jpg"), url("/assets/nophoto.png")'
    };
  }
}