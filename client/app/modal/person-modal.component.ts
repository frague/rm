import { Component, ViewChild, Input } from '@angular/core';
import { BaseModalComponent } from './base.component';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { ResourceService } from '../services/resource.service';

@Component({
  selector: 'person-modal',
  templateUrl: './person-modal.component.html'
})
export class PersonModal extends BaseModalComponent {
  @ViewChild('content') content;
  person: any = {};
  isLarge = true;

  constructor(
    modalService: NgbModal,
    private personService: ResourceService
  ) {
    super(modalService);
  }

  show(person: any, tabName = '') {
    if (typeof person === 'string') {
      this.isLoading = true;
      this.person = {};
      this.personService.getByLogin(person)
        .subscribe(
          person => this.person = person,
          err => console.log(err)
        )
        .add(() => this.isLoading = false);
    } else {
      this.person = person;
    }
    this.open(tabName);
  }
}