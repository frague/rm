import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'printable',
  templateUrl: './printable.component.html'
})
export class PrintableComponent {
  @Input() elementId: string = null;
  @Input() printableClassName = 'printable';
  @Output() stateChanged = new EventEmitter();

  isPrintable = false;
  public get className(): string {
    return this.isPrintable ? this.printableClassName : '';
  }

  togglePrintable() {
    this.isPrintable = !this.isPrintable;
    this.stateChanged.emit(this.isPrintable);
  }

  copy() {
    if (!this.elementId) {
      return false;
    }

    let [range, node, selection] = [document.createRange(), document.getElementById(this.elementId), window.getSelection()];
    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('copy');
    selection.removeAllRanges();
  }
}