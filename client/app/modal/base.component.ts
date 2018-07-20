import { BaseComponent } from '../base.component';
import { NgbModal, ModalDismissReasons, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

export abstract class BaseModalComponent {
	isLoading = false;
  modalRef: any;
  content: any;
  state: Object = {};
  isLarge = false;
  private baseOptions = {beforeDismiss: () => this.isSafeToProceed()};

  constructor(private modalService: NgbModal) {
  }

  tabChange(e) {
    if (!this.isSafeToProceed()) return e.preventDefault();
  }

  isSafeToProceed() {
    return true;
  }

  open() {
    let options: NgbModalOptions = Object.assign(this.isLarge ? {size: 'lg'} : {}, this.baseOptions);
    this.modalRef = this.modalService.open(this.content, options);
  }
}