import { Component, ViewChild, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { PrintableDatePipe } from '../pipes';

@Component({
  selector: 'person-modal',
  templateUrl: './person.component.html'
})
export class PersonComponent {
  @ViewChild('content') content;
  person: any = {};

  constructor(
    private modalService: NgbModal,
    private makeDate: PrintableDatePipe
  ) {}

  show(person: any) {
    this.person = person;
    this.modalService.open(this.content);
  }

  hasVisas() {
    return this.person.visaB || this.person.visaL;
  }

  getVisaInfo(key: string, title: string) {
    let till = this.person[key];
    if (till) {
      return title + ' till ' + this.makeDate.transform(till);
    }
    return '';
  }

}