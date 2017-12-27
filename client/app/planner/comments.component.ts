import { Component, ViewChild, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { CommentService} from '../services/comments.service';
import { BaseComponent } from '../base.component';
import { FormControl, FormGroup, Validators } from '@angular/forms';

const discardConfirmation = 'Are you sure you want to discard current changes?';
const empty = {
  date: null,
  isStatus: null,
  login: null,
  source: null,
  text: null,
  _id: null
};

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

  commentsAreShown = true;

  initialValue: any = empty;
  closeAfterSaving = true;

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

  tabChange(e) {
    if (!this.isSafeToProceed()) return e.preventDefault();

    this.commentsAreShown = e.nextId === 'comments';
    this.form.reset();
    this.initialValue = empty;
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

  saveComplex(tabs) {
    let newValue = this.getEditedValue();
    let newStatus = newValue.isStatus ? newValue.text : '';
    let doChange = newValue.isStatus || this.item.isStatus;
    return super.save().add(() => {
      if (doChange) {
        this.person.status = newValue.isStatus ? newValue : {};
        this.form.reset();
        this.initialValue = empty;
      }
      if (this.closeAfterSaving) {
        this.modalRef.close();
      } else {
        tabs.select('comments');
      }
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

  startEditing(item: any, tabs: any) {
    this.initialValue = item;
    tabs.select('add');
    this.form.setValue(this.enableEditing(item));
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
      this.commentsAreShown = true;
      this.form.reset({isStatus: !this.status});
    });
  }

  show(person: any) {
    console.log(person);
    this.items = [];
    this.person = person;
    this.modalRef = this.modalService.open(this.content, {size: 'lg', beforeDismiss: () => this.isSafeToProceed()});
    this.fetchData();
  }

  hasChanges() {
    let newValue = this.form.value;
    return ['source', 'text'].reduce((result, key) => {
      let a = this.initialValue[key] || null;
      let b = newValue[key] || null;
      return result || a !== b;
    }, false);
  }

  isSafeToProceed() {
    return (this.commentsAreShown || !this.hasChanges() || confirm(discardConfirmation));
  }

}