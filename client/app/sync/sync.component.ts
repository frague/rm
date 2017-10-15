import { Component } from '@angular/core';
import { Http } from '@angular/http';
import { Subscription } from 'rxjs';

import { ToastComponent } from '../shared/toast/toast.component';
import { InitiativeService } from '../services/initiative.service';
import { ResourceService } from '../services/resource.service';
import { AssignmentService } from '../services/assignment.service';
import { PmoService } from '../services/pmo.service';

import { environment } from '../../environments/environment';

import * as convert from 'color-convert';

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
    private initiativeService: InitiativeService,
    private resourceService: ResourceService,
    private assignmentService: AssignmentService,
    private pmo: PmoService
 ) {
  }

  cleanup(): Subscription {
    this.isLoading = true;
    return this.initiativeService.deleteAll().subscribe(
      () => {
        return this.resourceService.deleteAll().subscribe(
          () => {
            return this.assignmentService.deleteAll().subscribe(
              () => true,
              error => console.log(error)
            )
          },
          error => console.log(error)
        )
      },
      error => console.log(error)
    );
  }

  sync() {
    this.cleanup().add(() => {
      this.pmo.getAccounts().subscribe(data => {
        data.forEach(account => {
          console.log('account', account.name);
          account.projects.forEach(project => {
            console.log(project.name);
            let initiative = {
              name: project.name,
              color: '#' + convert.hsl.hex(360 * Math.random(), 50, 80)
            };
            this.initiativeService.add(initiative).subscribe();
          });
        });
      });
    });
  }
}
