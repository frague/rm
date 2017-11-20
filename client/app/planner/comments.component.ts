import { Component, ViewChild, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { CommentService} from '../services/comments.service';
import { BaseComponent } from '../base.component';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'comments-modal',
  templateUrl: './comments.component.html'
})
export class CommentsComponent extends BaseComponent {
  @ViewChild('content') content;
  person: any = {};
  comments: any[] = [];
  status: any = '';

  showComments = true;

  form = new FormGroup({
    _id: new FormControl(''),
    login: new FormControl(),
    isStatus: new FormControl(''),
    source: new FormControl(''),
    text: new FormControl('', Validators.required)
  })

  constructor(
    private modalService: NgbModal,
    private commentService: CommentService
  ) {
    super(commentService);
  }

  getEditedValue() {
    let comment = super.getEditedValue();
    comment.login = this.person.login;
    comment.date = new Date();
    return comment;
  }

  getLines(text: string): string[] {
    return (text || '').split('\n');
  }

  save() {
    return super.save().add(() => {
      this.fetchData();
      this.switchTab();
    });
  }

  fetchData() {
    this.commentService.getAll(this.person.login).subscribe((comments: any[]) => {
      this.status = '';
      this.comments = comments
        .reduce((result, comment) => {
            if (comment.isStatus) {
              this.status = comment;
            } else {
              result.push(comment);
            }
            return result;
          }, []);
    });
  }

  show(person: any) {
    this.person = person;
    this.modalService.open(this.content);
    this.fetchData();
  }

  switchTab(showComments = true) {
    this.showComments = showComments;
  }
}