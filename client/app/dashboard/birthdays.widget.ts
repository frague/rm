import { Component } from '@angular/core';
import { QueryWidget } from './query.widget';

@Component({
  selector: 'birthdays-widget',
  templateUrl: './query.widget.html'
})
export class BirthdaysWidget extends QueryWidget {
  _shortenDate(d: string): string {
    return (d || '     99-99').substr(5, 5);
  }

  postFetch(data: any[]): any[] {
    return data.sort((a, b) => this._shortenDate(a.birthday) > this._shortenDate(b.birthday) ? 1 : -1);
  }

  getLineClass(item): string|object {
    let now = this._shortenDate(new Date().toISOString());
    let then = this._shortenDate(item.birthday);
    return {
      today: now === then,
      past: now > then
    }
  }
}