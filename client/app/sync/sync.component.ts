import { Component } from '@angular/core';
import { Http } from '@angular/http';
import { Subscription } from 'rxjs';

import { ToastComponent } from '../shared/toast/toast.component';
import { InitiativeService } from '../services/initiative.service';
import { ResourceService } from '../services/resource.service';
import { AssignmentService } from '../services/assignment.service';

import { environment } from '../../environments/environment';

@Component({
  selector: 'sync',
  templateUrl: './sync.component.html'
})
export class SyncComponent {

  data: any = [];
  isLoading = false;

  constructor(
    private http: Http,
    public toast: ToastComponent,
    private initiativeServie: InitiativeService,
    private resourceService: ResourceService,
    private assignmentService: AssignmentService
 ) {
  }

  cleanup(): Subscription {
    this.isLoading = true;
    return this.initiativeServie.deleteAll().subscribe(
      () => {
        return this.resourceService.deleteAll().subscribe(
          () => {
            return this.assignmentService.deleteAll().subscribe(
              () => {},
              error => console.log(error)
            )
          },
          error => console.log(error)
        )
      },
      error => console.log(error)
    );
  }

  authInPMO() {
    console.log('PMO');
    this.http.get('/api/pmo').subscribe(() => {
      console.log('here');
      this.http.get('/api/pmo/accounts').subscribe();
    });
  }

  sync() {
    this.cleanup().add(() => {
      console.log(1);
      this.authInPMO();
    });
  }
}
