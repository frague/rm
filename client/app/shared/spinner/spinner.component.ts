import { Component, Input } from '@angular/core';

@Component({
	selector: 'spinner',
  templateUrl: './spinner.component.html'
})
export class SpinnerComponent {
  @Input() isShown = false;
  @Input() showContent = false;
}