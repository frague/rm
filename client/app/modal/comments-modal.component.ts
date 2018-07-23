import { Component, ViewChild, Input } from '@angular/core';
import { BaseModalComponent } from './base.component';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { CommentService } from '../services/comments.service';

@Component({
  selector: 'comments-modal',
  templateUrl: './comments-modal.component.html'
})
export class CommentsModal extends BaseModalComponent {
  isLarge = true;
  @ViewChild('content') content;
  title: any = '';
  key: string = '';

  constructor(
    modalService: NgbModal,
  ) {
    super(modalService);
  }

  show(key = '', title = '') {
    this.title = title;
    this.key = key;
    this.open();
  }
}