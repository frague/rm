import { EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { BaseComponent } from '../base.component';
import { NgbModal, ModalDismissReasons, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

export abstract class BaseModalComponent {
  modalRef: any;
  content: any;
  state: Object = {};
  isLarge = false;
  activeId = '';

  callback: Subject<any>;

  private baseOptions = {
    beforeDismiss: () => this._dismiss()
  };

  constructor(private modalService: NgbModal) {
  }

  private _dismiss() {
    if (!this.isSafeToProceed()) return false;
    this.callback.complete();
  }

  tabChange(e) {
    if (!this.isSafeToProceed()) return e.preventDefault();
  }

  // Can be overridden
  isSafeToProceed() {
    return true;
  }

  open(activeId = ''): Subject<any> {
    this.callback = new Subject();
    this.activeId = activeId;
    let options: NgbModalOptions = Object.assign(this.isLarge ? {size: 'lg'} : {}, this.baseOptions);
    this.modalRef = this.modalService.open(this.content, options);
    return this.callback;
  }
}