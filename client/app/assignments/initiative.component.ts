import { Component } from '@angular/core';

@Component({
  selector: 'initiative',
  template: '<i style="background-color:{{ color }}">{{ title }}</i>'
})
export class InitiativeComponent {
  constructor() {
    
  }
}