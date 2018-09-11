import { Component, ViewChild, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { BaseModalComponent } from './base.component';
import { ResourceService } from '../services/resource.service';
import { Utils } from '../utils';

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

  isTrue(value): boolean {
    return Utils.isTrue(value);
  }

  show(person: any, tabName = ''): Subject<any> {
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
    return this.open(tabName);
  }
}