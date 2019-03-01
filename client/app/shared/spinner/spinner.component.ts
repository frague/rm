import { Component, Input } from '@angular/core';

@Component({
	selector: 'spinner',
  templateUrl: './spinner.component.html'
})
export class SpinnerComponent {
  private _isShown = false;
  timer=0;
  private $timer;

  get isShown(): boolean {
    return this._isShown;
  }

  @Input('isShown')
  set isShown(value: boolean) {
    if (value !== this._isShown) {
      if (value) {
        this.timer = 0;
        this.$timer = setTimeout(() => this.timer++, 1000);
      } else {
        clearTimeout(this.$timer);
      }
    }
    this._isShown = value;
  }

  @Input() showContent = false;
}