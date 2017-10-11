import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'initiative',
  template: '<i class="initiative" [ngStyle]="style">{{ data.name }}</i>'
})
export class InitiativeComponent implements OnInit {
  @Input() data = {
    color: '',
    name: 'None'
  };

  public get style(): any {
    return {
      'background-color': this.data.color || '#EEE'
    };
  }

  constructor() {
    
  }

  ngOnInit() {
  }
}