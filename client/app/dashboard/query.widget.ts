import { Component, Input } from '@angular/core';

@Component({
  selector: 'query-widget',
  templateUrl: './query.widget.html'
})
export class QueryWidget {
  @Input() query: string = '';
  @Input() title: string = 'Query widget';

  constructor() {

  }
}