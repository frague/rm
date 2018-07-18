import { Component, Input, Output, EventEmitter } from '@angular/core';
import { BaseTabComponent } from './base.component';
import { PrintableDatePipe } from '../../pipes';
import { CommentService} from '../../services/comments.service';

@Component({
  selector: 'comments-tab',
  templateUrl: './comments-tab.component.html'
})
export class CommentsTabComponent extends BaseTabComponent {
  @Input() key: string;
  @Input() entity: any = {};

  comments: any[] = [];
  status: any = '';
  aggregated: any[] = [];
  initialValue: any = {};

  constructor(
    private makeDate: PrintableDatePipe,
    private commentService: CommentService,
  ) {
    super();
  }

  fetchData() {
    this.isLoading = true;
    this.commentService.getAll(this.key).subscribe((comments: any[]) => {
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

  startEditing(item: any) {
    this.initialValue = item;
  }


}