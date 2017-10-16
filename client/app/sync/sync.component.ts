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

const locations = {
  'Saratov': 'SAR',
  'Saint-Petersburg': 'SPB',
  'Menlo Park': 'MP',
  'Kharkov': 'KHR',
  'Krakow': 'KR',
  'Lviv': 'LV'
};
const myLocations = ['Saratov', 'Saint-Petersburg'];

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

  parseDate(milliseconds: number): string {
    if (!milliseconds) return '';
    return new Date(milliseconds).toString();
  }

  sync() {
    this.cleanup().add(() => {
      let initiativesIds = {};

      // this.pmo.getAccounts().subscribe(data => {
      //   data.forEach(account => {
      //     console.log('account', account.name);
      //     account.projects.forEach(project => {
      //       console.log(project.name);
      //       let initiative = {
      //         name: project.name,
      //         color: '#' + convert.hsl.hex(360 * Math.random(), 50, 80)
      //       };
      //       this.initiativeService.add(initiative).subscribe(
      //         initiative => 
      //       );
      //     });
      //   });
      // });
      this.pmo.getPeople().subscribe(data => {
        let initiatives = {};
        let assignments = [];

        data.rows.forEach(person => {
          let pool = '';
          if (person.workProfile === 'Data Scientist') pool = 'DS';
          else if (person.specialization === 'UI' && myLocations.indexOf(person.location) >= 0) pool = 'UI';

          if (!pool) return;
          let resource = {
            name: person.fullName,
            login: person.employeeId,
            grade: person.grade,
            location: locations[person.location],
            pool
          };

          this.resourceService.add(resource).subscribe(resource => {
            if (!person.account) return;

            person.account.forEach((account, index) => {
              let project = person.project[index];
              let name = account + ':' + project;
              let assignment = {
                resourceId: resource._id,
                name: project,
                account,
                start: this.parseDate(person.assignmentStart[index]),
                end: this.parseDate(person.assignmentFinish[index]),
                billability: person.assignmentStatus[index].name,
                involvement: person.involvements[index]
              };
              let initiative = initiatives[name];
              if (initiative) {
                assignment['initiativeId'] = initiative._id;
                console.log(1, assignment, resource);
                this.assignmentService.add(assignment).subscribe();
              } else {
                let initiative = {
                  name: project,
                  account,
                  color: '#' + convert.hsl.hex(360 * Math.random(), 50, 80)
                };
                this.initiativeService.add(initiative).subscribe(initiative => {
                  initiatives[name] = initiative;
                  assignment['initiativeId'] = initiative._id;
                  console.log(2, assignment, initiative);
                  this.assignmentService.add(assignment).subscribe();
                });
              }
            });
          });
        });
      });

    });
  }
}
