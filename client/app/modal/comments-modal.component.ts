import { Component, ViewChild, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { BaseModalComponent } from './base.component';
import { CommentService } from '../services/comments.service';

@Component({
  selector: 'comments-modal',
  templateUrl: './comments-modal.component.html'
})
export class CommentsModal extends BaseModalComponent {
  isLarge = true;
  @ViewChild('content', { static: true }) content;
  title: any = '';
  key: string = '';

  constructor(
    modalService: NgbModal,
  ) {
    super(modalService);
  }

  show(key = '', title = ''): Subject<any> {
    this.title = title;
    this.key = key;
    return this.open();
  }
}