import { Component, Input, Output, EventEmitter } from '@angular/core';

const stati = {
  progress: 'fa-spinner fa-spin',
  done: 'fa-check text-success',
  skipped: 'fa-lock grey',
  error: 'fa-exclamation-triangle text-danger',
  pending: 'fa-hourglass-start grey',
};

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
    return Object.keys(this.stati).length > 0
    ?
      (stati[this.status] || 'fa-ban')
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