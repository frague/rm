import { Component, ChangeDetectorRef } from '@angular/core';
import { CommentsTabComponent } from '../modal/tabs/comments-tab.component';
import { PrintableDatePipe } from '../pipes';
import { CommentService} from '../services/comments.service';
import { AuthService } from '../services/auth.service';
import { BusService } from '../services/bus.service';

@Component({
  selector: 'comments-widget',
  templateUrl: './comments.widget.html'
})
export class CommentsWidget extends CommentsTabComponent {
  constructor(
    makeDate: PrintableDatePipe,
    commentService: CommentService,
    bus: BusService,
    cd: ChangeDetectorRef,
    private auth: AuthService
  ) {
    super(makeDate, commentService, bus, cd);
    this.key = '%notes_' + this.auth.currentUser.username;
  }
}