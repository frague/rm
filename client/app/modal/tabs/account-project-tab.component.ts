import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommentsTabComponent } from './comments-tab.component';
import { AssignmentService } from '../../services/assignment.service';
import { BusService } from '../../services/bus.service';
import { CommentService} from '../../services/comments.service';
import { PrintableDatePipe } from '../../pipes';
import * as md5 from 'md5';

@Component({
  selector: 'account-project-tab',
  templateUrl: './account-project-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountProjectTabComponent extends CommentsTabComponent {
  @Input() account: string;
  @Input() initiative: string;
  @Input() login: string;
  @Input() state: any = {};

  _makeDate = {
    transform: (date: any, format?: any) => ''
  };
  _cd;

  constructor(
    private assignmentService: AssignmentService,
    makeDate: PrintableDatePipe,
    commentService: CommentService,
    bus: BusService,
    cd: ChangeDetectorRef
  ) {
    super(makeDate, commentService, bus, cd);
    this._makeDate = makeDate;
    this._cd = cd;
  }

  public get key(): string {
    if (!this.account || !this.initiative) {
      return null;
    }
    return '%' + md5(this.account) + '_' + md5(this.initiative);
  }

  processAssignments(assignments: any[]) {
    let now = this._makeDate.transform(new Date(), 'ten');
    let current = assignments.find(assignment => assignment.start);
    this.isLoading = false;

    if (current) {
      [this.account, this.initiative] = [current.account, current.project];
      this.setState('currentAccount', this.login, this.account);
      this.setState('currentProject', this.login, this.initiative);
      return super.fetchData();
    }
    this._cd.markForCheck();
    return new Subscription();
  }

  fetchData() {
    if (this.login) {
      let currentAccount = this.getState('currentAccount', this.login);
      let currentProject = this.getState('currentProject', this.login);

      if (currentAccount && currentProject) {
        [this.account, this.initiative] = [currentAccount, currentProject];
        return super.fetchData();
      }

      let assignments = this.getState('assignments', this.login);
      if (assignments && assignments.length) {
        return this.processAssignments(assignments);
      }

      this.isLoading = true;
      this.assignmentService.get({_id: this.login})
        .subscribe(
          data => {
            this.setState('assignments', this.login, data);
            return this.processAssignments(data);
          }
        );
    } else {
      return super.fetchData();
    }
  }
}