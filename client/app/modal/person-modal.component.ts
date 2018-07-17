import { Component, ViewChild, Input } from '@angular/core';
import { BaseModalComponent } from './base.component';
import { UserTabComponent } from './tabs/user-tab.component';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'person-modal-new',
  templateUrl: './person-modal.component.html'
})
export class PersonModal extends BaseModalComponent {
  @ViewChild('content') content;
  @ViewChild(UserTabComponent) userTab: UserTabComponent;

  tabs = [this.userTab];

  constructor(modalService: NgbModal) {
    super(modalService);
  }
}