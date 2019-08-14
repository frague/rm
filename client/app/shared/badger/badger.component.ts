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
  isEditing = false;

  newBadge = {};

  constructor() {
  }

  reset() {
    this.newBadge = {
      title: '',
      color: ''
    };
  }

  add() {
    this.reset();
    this.isEditing = true;
  }

  cancel() {
    this.isEditing = false;
    this.isHovered = false;
    this.reset();
  }

  checkKey(event: KeyboardEvent) {
    
  }

  getBadgeStyle(badge: any) {
    return {'background-color': badge.color};
  }
}