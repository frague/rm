import { Component, Input, ChangeDetectorRef } from '@angular/core';

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
        this.$timer = setInterval(() => {this.timer++; this.cd.markForCheck()}, 1000);
      } else {
        clearInterval(this.$timer);
      }
      this.cd.markForCheck();
    }
    this._isShown = value;
  }

  @Input() showContent = false;

  constructor(private cd: ChangeDetectorRef) {}
}