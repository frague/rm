import { Component, ViewChild, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

type personType = {
  name: string,
  login: string,
  grade: [string],
  location: [string]
};

@Component({
  selector: 'person-modal',
  templateUrl: './person.component.html'
})
export class PersonComponent {
  @ViewChild('content') content;
  person: personType = {} as personType;

  constructor(
    private modalService: NgbModal
  ) {}

  show(person: any) {
    this.person = person;
    // console.log(person);
    this.modalService.open(this.content);
  }

}