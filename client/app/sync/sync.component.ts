import { Component } from '@angular/core';
import { Http } from '@angular/http';
import { Subscription } from 'rxjs';

import { ToastComponent } from '../shared/toast/toast.component';
import { InitiativeService } from '../services/initiative.service';
import { ResourceService } from '../services/resource.service';
import { AssignmentService } from '../services/assignment.service';
import { PmoService } from '../services/pmo.service';
import { BambooService } from '../services/bamboo.service';
import { DemandService } from '../services/demand.service';

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
  loadings = {};
  private _peopleByName = {};

  constructor(
    private http: Http,
    public toast: ToastComponent,
    private initiativeService: InitiativeService,
    private resourceService: ResourceService,
    private assignmentService: AssignmentService,
    private pmo: PmoService,
    private bamboo: BambooService,
    private demandService: DemandService
 ) {
  }

  get isLoading(): boolean {
    return Object.values(this.loadings).some(value => !!value);
  }

  getProgress() {
    return Object.keys(this.loadings);
  }

  cleanup(): Subscription {
    this.loadings['cleanup'] = true;
    return this.initiativeService.deleteAll().subscribe(
      () => {
        return this.resourceService.deleteAll().subscribe(
          () => {
            return this.assignmentService.deleteAll().subscribe(
              () => {
                return this.demandService.deleteAll().subscribe(
                  () => this.loadings['cleanup'] = false,
                  error => console.log(error)
                )
              },
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

  _queryBamboo() {
    this.loadings['bamboo'] = true;
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
          if (request.status && request.status['$t'] === 'approved') {
            addVacation(resource._id, request.start, request.end);
          }
        });

        this.loadings['bamboo'] = false;
      });
    });
  }

  _queryPMO(): Subscription {
    this.loadings['pmo'] = true;
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
          this.loadings['pmo'] = false;
        });
      });
    });
  }

  _parseDate(date: string): Date {
    date = date.replace(/[^\da-zA-Z\-\s]/g, ' ').replace(/\s+/g, ' ');
    if (date) return new Date(date)
    else return null;
  }

  _parseDuration(duration: string): number {
    duration = duration.replace(/^[^\d]+/g, '').substr(0, 2);
    if (!duration) return 6;
    return parseInt(duration);
  }

  _queryDemand() {
    this.loadings['demands'] = true;

    // Query Demand file
    return this.demandService.import().subscribe(data => {
      data.forEach(demandLine => {
        let start = this._parseDate(demandLine[7]);
        let duration = this._parseDuration(demandLine[9]);
        let end = start ? (duration ? start.setMonth(start.getMonth() + duration) : start) : null;

        let demand = {
          account: demandLine[0],
          status: demandLine[1],
          acknowledgement: demandLine[2],
          role: demandLine[3],
          profile: demandLine[4],
          comment: demandLine[5],
          deployment: demandLine[6],
          start,
          end,
          stage: demandLine[8],
          grades: demandLine[10].split(/[,-]/g),
          locations: [
            !!demandLine[11],
            !!demandLine[12],
            !!demandLine[13],
            !!demandLine[14],
            !!demandLine[15],
            !!demandLine[16]
          ],
          requestId: demandLine[17]
        };

        if (demand.status !== 'active' || demand.profile.toLowerCase().indexOf('ui') < 0) return;
        this.demandService.add(demand).subscribe();
      });
      this.loadings['demands'] = false;
    });
  }

  sync() {
    this.cleanup().add(() => {
      this._queryDemand();
      this._queryPMO().add(() => {
        this._queryBamboo();
      });
    });
  }
}
