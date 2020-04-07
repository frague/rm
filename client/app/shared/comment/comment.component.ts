import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Subscription, Subject } from 'rxjs';
import { PrintableDatePipe } from '../../pipes';
import { CommentService} from '../../services/comments.service';
import { BusService } from '../../services/bus.service';

const isDate = new RegExp(/^[12]\d{3}\-/);


@Component({
  selector: 'comment',
  templateUrl: './comment.component.html'
})
export class CommentComponent {
  @Input() comment: any = {};
  @Output() callback: EventEmitter<any> = new EventEmitter();

  constructor(
    private makeDate: PrintableDatePipe,
    private commentService: CommentService,
    private bus: BusService
  ) {

  }

  _confirmDeletion() {
    return confirm(`Are you sure you want to delete this note?
You won't be able to undo that - the data will be erased permanently.`);
  }

  delete() {
    if (this._confirmDeletion()) {
      return this.commentService.delete(this.comment)
        .subscribe(
          () => this.callback.emit(),
          error => console.log('Error deleting the comment', error)
        );
    }
  }

  edit() {
    let o: any = Object.assign({}, this.comment);
    delete o.__v;
    Object.keys(o).forEach(key => {
      let v = o[key];
      if (isDate.test(v)) {
        o[key] = v.substr(0, 10);
      }
    });
    return this.bus.showEditor(o)
      .then(data => this.commentService.save(data)
        .subscribe(() => this.callback.emit())
      )
      .catch(err => console.log('Editing cancelled', err));
  }
}