import { Component, ViewChild, ElementRef } from '@angular/core';
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
import * as Confluence from 'confluence-api';

import { replaceFromMap, accountsMap, billabilityMap, locationsMap, locations, profilesInvertedMap } from './mappings';

const myLocations = ['Saratov', 'Saint-Petersburg'];
const hours24 = 86400000;

@Component({
  selector: 'sync',
  templateUrl: './sync.component.html'
})
export class SyncComponent {

  @ViewChild('log') logWindow: ElementRef;

  data: any = [];
  logs = [];
  loadings = {};
  private _peopleByName = {};
  private _accounts = {};
  private _whois = {};

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

  private addLog(text: string, source='') {
    this.logs.push((source ? source + ': ' : '') + text);
    if (this.logWindow) {
      this.logWindow.nativeElement.scrollBy(0, 50);
    }
  }

  cleanup(): Subscription {
    this.logs = [];
    this.loadings['cleanup'] = true;
    return this.initiativeService.deleteAll().subscribe(
      () => {
        this.addLog('Initiatives removed');
        return this.resourceService.deleteAll().subscribe(
          () => {
            this.addLog('Resources removed');
            return this.assignmentService.deleteAll().subscribe(
              () => {
                 this.addLog('Assignments removed');
                return this.demandService.deleteAll().subscribe(
                  () => {
                    this.addLog('Demands removed');
                    this.loadings['cleanup'] = false;
                  },
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
      this.addLog('Received vacations information', 'Bamboo');

      this.initiativeService.add({
        name: 'Vacation',
        account: 'Griddynamics',
        color: '#1ca1c0'
      }).subscribe(vacation => {
        let vacationId = vacation._id;
        let addVacation = (resourceId, startDate, endDate) => {
          // console.log('add vacation', resourceId, startDate, endDate);
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
        let vacationsCount = 0;
        data.requests.request.forEach(request => {
          let name = request.employee['$t'];
          let resource = this._peopleByName[name];
          if (!resource) {
            this.addLog('Unable to add vacations for ' + name);
            return;
          }
          if (request.status && request.status['$t'] === 'approved') {
            addVacation(resource._id, request.start, request.end);
            vacationsCount++;
          }
        });

        this.addLog(vacationsCount + ' vacation records created', 'Bamboo');
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

      this.addLog(data.rows.length + ' records received', 'PMO');

      let peopleSorted = data.rows.sort((a, b) => (a.name > b.name) ? 1 : -1);
      peopleSorted.forEach(person => {
        if (!profilesInvertedMap[person.workProfile]) return;
        let pool = profilesInvertedMap[person.workProfile][person.specialization];
        if (!pool) return;

        let who = this._whois[person.employeeId] || {};

        let resource = {
          name: person.fullName,
          login: person.employeeId,
          grade: person.grade,
          location: locationsMap[person.location],
          profile: person.workProfile,
          specialization: person.specialization,
          pool,
          manager: who.manager,
          skype: who.skype,
          phone: who.phone,
          room: who.room
        };
        // console.log(resource);

        this.resourceService.add(resource).subscribe(resource => {
          this.addLog('Created profile for ' + resource.name);

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
            this._accounts[account] = true;
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

  _queryConfluence() {
    this.loadings['whois'] = true;

    return this.resourceService.getWhois().subscribe(
      data => {
        this.addLog(data.length + ' records received', 'Whois');

        this._whois = data.reduce((result, u) => {
          let [pool, name, account, initiative, profile, grade, manager, location, skype, phone, room, login] = u;
          result[login] = {manager, skype, phone, room};
          return result;
        }, {});
        this.loadings['whois'] = false;
      }
    );
  }

  _parseDate(date: string): Date {
    let d = date.replace(/[^\da-zA-Z\-\s]/g, ' ').replace(/\s+/g, ' ');
    return d ? new Date(d) : null;
  }

  _parseDuration(duration: string): number {
    duration = duration.replace(/[^\d-]/g, '').substr(0, 2);
    duration = duration.split('-')[0];    // 6-9 months range
    return duration ? parseInt(duration) : 6;
  }

  _queryDemand() {
    this.loadings['demands'] = true;

    this.initiativeService.add({
      name: 'Demand',
      account: 'Griddynamics',
      color: '#FF3232'
    }).subscribe();

    // Query Demand file
    return this.demandService.import().subscribe(data => {
      this.addLog(data.length + ' records received', 'Demand');
      data.forEach(demandLine => {
        let start = this._parseDate(demandLine[7]);
        let duration = this._parseDuration(demandLine[9]);
        let end;
        if (start) {
          if (!duration) {
            duration = 6;
          }
          end = new Date(start);
          end.setMonth(start.getMonth() + duration);
        } else {
          end = start;
        }

        let account = demandLine[0];
        if (!this._accounts[account]) {
          if (accountsMap[account]) {
            account = accountsMap[account];
          } else {
            console.log('Unknown account:', account);
          }
        }

        let demandLocations = demandLine.slice(11, 17);
        let l = locations.filter((location, index) => !!demandLocations[index]);

        let demand = {
          account,
          status: demandLine[1],
          acknowledgement: demandLine[2],
          role: replaceFromMap(billabilityMap, demandLine[3]),
          profile: demandLine[4],
          comment: demandLine[5],
          deployment: demandLine[6],
          start,
          end,
          stage: demandLine[8],
          grades: demandLine[10].split(/[,-]/g),
          locations: l,
          requestId: demandLine[17]
        };

        let profile = demand.profile.toLowerCase();
        if (
          demand.status !== 'active'
          || (profile.indexOf('ui') < 0 && profile.indexOf('datascientist') < 0)
        ) return;
        // console.log(demand);
        this.addLog('Created demand for ' + demand.account);

        this.demandService.add(demand).subscribe();
      });
      this.loadings['demands'] = false;
    });
  }

  sync() {
    this.cleanup().add(() => {
      this._queryConfluence().add(() =>
        this._queryPMO().add(() => {
          this._queryBamboo();
          this._queryDemand();
        })
      )
    })
  }
}
