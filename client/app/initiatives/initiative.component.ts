import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'initiative',
  template: '<i class="initiative" [ngStyle]="getStyle()">{{ data.name }}</i>'
})
export class InitiativeComponent implements OnInit {
  @Input() data: any = {
    color: '',
    name: 'None'
  };

  public getStyle(): any {
    return {
      'background-color': this.data.color || '#EEE',
      left: (this.data.offset || 0) + 'px',
      width: this.data.width ? this.data.width + 'px' : 'auto'
    };
  }

  constructor() {
  }

  ngOnInit() {
  }
}