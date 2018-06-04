import { Component, ViewChild, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { PrintableDatePipe } from '../pipes';
import { DomSanitizer } from '@angular/platform-browser';

import { ResourceService } from '../services/resource.service';

@Component({
  selector: 'person-modal',
  templateUrl: './person.component.html'
})
export class PersonComponent {
  @ViewChild('content') content;
  person: any = {};

  isLoading = false;

  constructor(
    private modalService: NgbModal,
    private makeDate: PrintableDatePipe,
    public sanitizer: DomSanitizer,
    private personService: ResourceService
  ) {}

  show(person: any) {
    if (typeof person === 'string') {
      this.isLoading = true;
      this.personService.getByLogin(person).subscribe(
        person => this.person = person,
        err => console.log(err)
      ).add(() => {
        this.isLoading = false;
      });
    } else {
      this.person = person;
    }
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

  getSkype(skypeId: string) {
    return this.sanitizer.bypassSecurityTrustUrl('skype:' + skypeId + '?chat');
  }

}