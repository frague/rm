import { Component, ViewChild, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { CommentService} from '../services/comments.service';

@Component({
  selector: 'comments-modal',
  templateUrl: './comments.component.html'
})
export class CommentsComponent {
  @ViewChild('content') content;
  person: any = {};

  constructor(
    private modalService: NgbModal,
    private commentService: CommentService
  ) {}

  show(person: any) {
    this.person = person;
    this.modalService.open(this.content);
  }
}