import { Component, ViewChild, Input } from '@angular/core';
import { BaseModalComponent } from './base.component';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { ResourceService } from '../services/resource.service';

@Component({
  selector: 'person-modal-new',
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

  show(person: any) {
    if (typeof person === 'string') {
      this.person = {};
      this.personService.getByLogin(person).subscribe(
        person => this.person = person,
        err => console.log(err)
      );
    } else {
      this.person = person;
    }
    this.open();
  }
}