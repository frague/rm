import { Component, ViewChild, Input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { CommentService} from '../services/comments.service';
import { SkillsService} from '../services/skills.service';
import { CarreerService} from '../services/carreer.service';
import { BaseComponent } from '../base.component';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PrintableDatePipe } from '../pipes';

const discardConfirmation = 'Are you sure you want to discard current changes?';
const datePipe = new PrintableDatePipe();

export abstract class BaseModalComponent {
  modalRef: any;
  content: any;
  activeTab: string;

  constructor(private modalService: NgbModal) {
    this.fetchData();
  }

  fetchData() {
  }

  tabChange(e) {
    if (!this.isSafeToProceed()) return e.preventDefault();
  }

  hasChanges(): boolean {
    // let newValue = this.form.value;
    // return ['source', 'text', 'isStatus'].some(
    //   key => (this.initialValue[key] || null) !== (newValue[key] || null)
    // );
    return false;
  }

  isSafeToProceed(): boolean {
    // return !this.isFormActive || !this.hasChanges() || confirm(discardConfirmation);
    return true;
  }

  open() {
    this.modalRef = this.modalService.open(this.content, {size: 'lg', beforeDismiss: () => this.isSafeToProceed()});
  }
}