import { Component, Input, Output, ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription, Subject } from 'rxjs';
import { BaseTabComponent } from './base.component';
import { PrintableDatePipe } from '../../pipes';
import { CommentService} from '../../services/comments.service';

const isDate = new RegExp(/^[12]\d{3}\-/);

@Component({
  selector: 'comments-tab',
  templateUrl: './comments-tab.component.html',
})
export class CommentsTabComponent extends BaseTabComponent {
  @Input() key: string;
  @Input() callback: Subject<any> = new Subject();
  @ViewChild('markdown') markdown: ElementRef;

  status: any = '';
  aggregated: any[] = [];
  initialValue: any = null;
  commentsCount = 0;

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
    private cd: ChangeDetectorRef
  ) {
    super();
  }

  fetchData(): Subscription {
    this.isLoading = true;
    return this.commentService.getAll(this.key)
      .subscribe((notes: any[]) => {
        this.status = '';
        this.commentsCount = notes.length;
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

  _confirmDeletion() {
    return confirm('Are you sure you want to delete this note?\nYou won\'t be able to undo that.');
  }

  _emitChanges() {
    this.callback.next({
      status: this.status,
      commentsCount: this.commentsCount
    });
  }

  delete(item: any) {
    if (this._confirmDeletion()) {
      return this.commentService.delete(item)
        .subscribe(() => {
          this.fetchData().add(() => this._emitChanges());
        });
    }
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

  save() {
    this.commentService.save(this.form.value)
      .subscribe(() => {
        this.fetchData().add(() => this._emitChanges());
        this.discard();
      })
  }

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

  isFormValid() {
    return this.form.status !== 'INVALID';
  }

  showNoRecords() {
    return !this.isEditing() && (!this.aggregated || !this.aggregated.length);
  }

  reposition(event: Event) {
    let t = event.srcElement;
    let m = this.markdown;
    if (t && m) {
      let p = t.scrollTop / (t.scrollHeight - t.clientHeight);
      let c = m.nativeElement.scrollHeight - m.nativeElement.clientHeight;
      m.nativeElement.scrollTop = Math.round(c * p);
    }
  }
}