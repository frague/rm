import { Component, Input } from '@angular/core';

@Component({
  selector: 'badger',
  templateUrl: './badger.component.html'
})
export class BadgerComponent {
  @Input() badges: any[] = [
    {title: 'AngularJS', color: 'red'},
    {title: '@ngular', color: 'orangered'},
    {title: 'react', color: 'magenta'},
  ];

  isHovered = false;

  constructor() {
  }

  add() {}

  getBadgeStyle(badge: any) {
    return {'background-color': badge.color};
  }
}