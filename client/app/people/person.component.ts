import { Component, ViewChild } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'person',
  templateUrl: './person.component.html'
})
export class PersonComponent {
  @ViewChild('content') content;
  constructor(private modalService: NgbModal) {

  }

  show() {
    console.log(this.content);
    this.modalService.open(this.content);
  }

}