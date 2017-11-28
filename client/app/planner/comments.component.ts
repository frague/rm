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
  aggregated: any[] = [];
  modalRef: any;

  showComments = true;

  form = new FormGroup({
    _id: new FormControl(''),
    login: new FormControl(''),
    date: new FormControl(''),
    isStatus: new FormControl(),
    source: new FormControl(''),
    text: new FormControl('', Validators.required)
  })

  constructor(
    private modalService: NgbModal,
    private commentService: CommentService
  ) {
    super(commentService);
  }

  ngOnInit() {}

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
    let newValue = this.getEditedValue();
    let newStatus = newValue.isStatus ? newValue.text : '';
    let doChange = newValue.isStatus || this.item.isStatus;
    return super.save().add(() => {
      if (doChange) {
        this.person.status = newValue.isStatus ? newValue : {};
      }
      this.modalRef.close();
    });
  }

  delete(item: any) {
    let isStatus = item.isStatus;
    return super.delete(item).add(() => {
      if (isStatus) {
        this.person.status = null;
      }
      this.fetchData();
    });
  }

  startEditing(item: any) {
    this.enableEditing(item);
    this.switchTab(false);
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
      this.aggregated = Array.from(this.comments);
      if (this.status) {
        this.aggregated.unshift(this.status);
      }
      this.showComments = this.aggregated.length > 0;
      this.form.reset({isStatus: !this.status});
    });
  }

  show(person: any) {
    this.items = [];
    this.person = person;
    this.modalRef = this.modalService.open(this.content, {size: 'lg'});
    this.fetchData();
  }

  switchTab(showComments = true) {
    this.showComments = showComments;
  }
}