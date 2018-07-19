import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BaseTabComponent } from './base.component';
import { PrintableDatePipe } from '../../pipes';
import { CommentService} from '../../services/comments.service';

const isDate = new RegExp(/^[12]\d{3}\-/);

@Component({
  selector: 'comments-tab',
  templateUrl: './comments-tab.component.html'
})
export class CommentsTabComponent extends BaseTabComponent {
  @Input() key: string;
  @Input() entity: any = {};

  status: any = '';
  aggregated: any[] = [];
  initialValue: any = null;

  form = new FormGroup({
    _id: new FormControl(''),
    login: new FormControl(''),
    date: new FormControl(''),
    isStatus: new FormControl(),
    source: new FormControl(''),
    text: new FormControl('', Validators.required)
  });

  constructor(
    private makeDate: PrintableDatePipe,
    private commentService: CommentService,
  ) {
    super();
  }

  fetchData() {
    this.isLoading = true;
    this.commentService.getAll(this.key).subscribe((notes: any[]) => {
      this.status = '';
      let comments = notes
        .reduce((result, comment) => {
          if (comment.isStatus) {
            this.status = comment;
          } else {
            result.push(comment);
          }
          return result;
        }, []);
      this.aggregated = Array.from(comments);
      if (this.status) {
        this.aggregated.unshift(this.status);
      }
    })
      .add(() => this.isLoading = false);
  }

  delete(item: any) {
    let isStatus = item.isStatus;
    return this.commentService.delete(item)
      .subscribe(() => {
        if (isStatus) {
          this.entity.status = null;
        }
        this.entity.commentsCount--;
        this.fetchData();
      });
  }

  edit(item: any) {
    let o: any = Object.assign({}, item);
    delete o.__v;
    Object.keys(o).forEach(key => {
      let v = o[key];
      if (isDate.test(v)) {
        o[key] = v.substr(0, 10);
      }
    });
    this.form.setValue(o);
    this.initialValue = o;
  }

  save() {}

  discard() {
    this.initialValue = null;
  }

  isEditing() {
    return null !== this.initialValue;
  }

  getVisibleRecords() {
    return this.isEditing() ? [this.form.value] : this.aggregated;
  }

  getEmpty() {
    return {
      _id: null,
      login: this.key,
      date: new Date(),
      isStatus: false,
      source: '',
      text: ''
    }
  }
}