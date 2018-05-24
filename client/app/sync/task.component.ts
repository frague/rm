import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'task',
  templateUrl: './task.component.html'
})
export class TaskComponent {
  @Input('name') name: string;
  @Input('props') props: any = {};
  @Input('stati') stati: any = {};
  @Output('setState') setState: EventEmitter<any> = new EventEmitter();

  checked = true;
  private _statuses = {};
  private _disableds = {};

  public get status(): string {
    return this.stati[this.name] || '';
  }

  constructor() {
  }

  ngOnInit() {
    this.checked = this.props.hasOwnProperty('default') ? this.props.default : true;
    if (this.props.dependants) {
      this._disableds = Object.keys(this.props.dependants).reduce((result, key) => {
        result[key] = false;
        return result;
      }, {});
    }
    this.registerState();
  }

  getIconStyles() {
    let status = this.status;
    return status ?
    {
      'circle-o-notch rotate': status == 'progress',
      'check-circle-o green': status == 'done',
      'times-circle-o grey': status == 'skip',
    }
      :
    {
      'fa-check-square': this.checked,
      'fa-square': !this.checked,

    };
  }

  registerState() {
    this.setState.emit(Object.assign({[this.name]: this.checked}, this.checked ? this._statuses : this._disableds));
  }

  validate(event: MouseEvent) {
    setTimeout(() => this.registerState(), 1);
    if (this.props.mandatory) return false;
  }

  collectTasks(data: any) {
    this._statuses = Object.assign(this._statuses, data);
    this.registerState();
  }
}