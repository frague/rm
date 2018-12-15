import { Component, Input, Output, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Subscription, Subject } from 'rxjs';
import { BaseTabComponent } from './base.component';
import { PrintableDatePipe } from '../../pipes';
import { CommentService} from '../../services/comments.service';
import { BusService } from '../../services/bus.service';

const isDate = new RegExp(/^[12]\d{3}\-/);

@Component({
  selector: 'comments-tab',
  templateUrl: './comments-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommentsTabComponent extends BaseTabComponent {
  @Input() key: string;
  @Input() callback: Subject<any> = new Subject();

  status: any = '';
  aggregated: any[] = [];
  commentsCount = 0;

  constructor(
    private makeDate: PrintableDatePipe,
    private commentService: CommentService,
    private bus: BusService,
    private cd: ChangeDetectorRef
  ) {
    super();
  }

  fetchData(): Subscription {
    if (!this.key) {
      return;
    }

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
      .add(() => this.isLoading = false)
      .add(() => this.cd.markForCheck());
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
    this.bus.showEditor(o)
      .then(data => this.commentService.save(data)
        .subscribe(() => this.fetchData().add(() => this._emitChanges()))
      )
      .catch(err => console.log('Editing cancelled', err));
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
