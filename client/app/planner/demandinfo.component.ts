import { Component, Input, Output, EventEmitter } from '@angular/core';

const unders = new RegExp('_', 'g');

@Component({
  selector: 'demand',
  templateUrl: './demandinfo.component.html'
})
export class DemandInfo {
  private _login = '';
  id = '';
  project = '';
  account = '';

  @Input()
  set login(login: string) {
    this._login = login;
    let [head, account] = login.split('_for_');
    let [id, ...project] = head.split('_');
    [this.id, this.account, this.project] = [id, account.replace(unders, ' '), project.join(' ')];
  }

  @Output() show: EventEmitter<string> = new EventEmitter();

  showDemand(event: MouseEvent) {
    event.stopPropagation();
    this.show.emit({isDemand: true, demand: this._login});
  }
}