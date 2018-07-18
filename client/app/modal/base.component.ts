import { BaseComponent } from '../base.component';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

export abstract class BaseModalComponent {
  modalRef: any;
  content: any;
  _state: Object = {};

  constructor(private modalService: NgbModal) {
  }

  tabChange(e) {
    if (!this.isSafeToProceed()) return e.preventDefault();
  }

  isSafeToProceed() {
    return true;
  }

  open() {
    this.modalRef = this.modalService.open(this.content, {size: 'lg', beforeDismiss: () => this.isSafeToProceed()});
  }
}