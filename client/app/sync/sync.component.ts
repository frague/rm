import { Component } from '@angular/core';
import { Http } from '@angular/http';
import { Subscription } from 'rxjs';

import { ToastComponent } from '../shared/toast/toast.component';
import { InitiativeService } from '../services/initiative.service';
import { ResourceService } from '../services/resource.service';
import { AssignmentService } from '../services/assignment.service';
import { PmoService } from '../services/pmo.service';
import { BambooService } from '../services/bamboo.service';

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
const hours24 = 86400000;

@Component({
  selector: 'sync',
  templateUrl: './sync.component.html'
})
export class SyncComponent {

  data: any = [];
  private _loadings = {};
  private _peopleByName = {};

  constructor(
    private http: Http,
    public toast: ToastComponent,
    private initiativeService: InitiativeService,
    private resourceService: ResourceService,
    private assignmentService: AssignmentService,
    private pmo: PmoService,
    private bamboo: BambooService
 ) {
  }

  get isLoading(): boolean {
    return Object.values(this._loadings).some(value => !!value);
  }

  cleanup(): Subscription {
    this._loadings['pmo'] = true;
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
      error => console.log(error),
      () => this._loadings['pmo'] = false
    );
  }

  parseDate(milliseconds: number): string {
    if (!milliseconds) return '';
    return new Date(milliseconds).toString();
  }

  _queryBamboo() {
    this._loadings['bamboo'] = true;
    return this.bamboo.getTimeoffs().subscribe(data => {
      this.initiativeService.add({
        name: 'Vacation',
        account: 'Griddynamics',
        color: '#1ca1c0'
      }).subscribe(vacation => {
        let vacationId = vacation._id;
        let addVacation = (resourceId, startDate, endDate) => {
          console.log('add vacation', resourceId, startDate, endDate);
          this.assignmentService.add({
            initiativeId: vacationId,
            resourceId,
            start: startDate,
            end: endDate,
            billability: 'non-billable',
            involvement: 100
          }).subscribe();
        };

        let vacationRequests = {};
        data.requests.request.forEach(request => {
          let name = request.employee['$t'];
          let resource = this._peopleByName[name];
          if (!resource) {
            console.log('Unable to add vacations for', name);
            return;
          }

          addVacation(resource._id, request.start, request.end);
        });

        // Object.keys(vacationRequests).forEach(name => {
        //   let resource = this._peopleByName[name];
        //   if (!resource) {
        //     console.log('Unable to add vacations for', name);
        //     return;
        //   }

        //   let dates = vacationRequests[name].sort();
        //   let startDate, endDate, cursorDate;
        //   dates.forEach(date => {
        //     addVacation(resource._id, startDate, dates.pop());
        //     let d = new Date(date).getMilliseconds();
        //     if (!cursorDate) {
        //       startDate = date;
        //       endDate = date;
        //       cursorDate = d;
        //       return;
        //     } else if (d - cursorDate != hours24) {
        //       addVacation(resource._id, startDate, endDate);
        //       startDate = date;
        //       endDate = date;
        //       cursorDate = d;
        //     } else {
        //       endDate = date;
        //     }
        //   });
        //   if (dates.length) {
        //     addVacation(resource._id, startDate, dates.pop());
        //   }
        // });

        this._loadings['bamboo'] = false;
      });
    });
  }

  _queryPMO(): Subscription {
    let initiativesIds = {};
    let hue = 0;

    // Query PMO
    return this.pmo.getPeople().subscribe(data => {
      let initiatives = {};
      let initiativesCreators = {};
      let assignments = [];

      let peopleSorted = data.rows.sort((a, b) => (a.name > b.name) ? 1 : -1);
      peopleSorted.forEach(person => {
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
          let name = resource.name.split(' ').reverse().join(' ');
          this._peopleByName[resource.name] = resource;
          this._peopleByName[name] = resource;

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
            let initiative = initiativesCreators[name];
            if (initiative) {
              initiative.add(() => {
                assignment['initiativeId'] = initiatives[name]._id;
                this.assignmentService.add(assignment).subscribe();
              });
            } else {
              hue = (hue + 10) % 360;
              let initiative = {
                name: project,
                account,
                color: '#' + convert.hsl.hex(hue, 50, 80)
              };
              initiativesCreators[name] = this.initiativeService.add(initiative).subscribe(initiative => {
                initiatives[name] = initiative;
                assignment['initiativeId'] = initiative._id;
                this.assignmentService.add(assignment).subscribe();
              });
            }
          });
        });
      });
    });
  }

  sync() {
    this.cleanup().add(() => {
      this._queryPMO().add(() => {
        this._queryBamboo();
      });
    });
  }
}
