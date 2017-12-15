import Initiative from '../models/initiative';
import Resource from '../models/resource';
import Assignment from '../models/assignment';
import Demand from '../models/demand';

import IntegrationsCtrl from './integrations';
import DiffCtrl from './diff';

import * as convert from 'color-convert';
import * as Confluence from 'confluence-api';
import {
  replaceFromMap,
  accountsMap,
  billabilityMap,
  locationsMap,
  locations,
  profilesInvertedMap,
  demandProfilesMap
} from '../mappings';

export default class SyncCtrl {

  data: any = [];
  logs = [];
  loadings = {};

  private _peopleByName = {};
  private _accounts = {};
  private _whois = {};

  integrationsCtrl = new IntegrationsCtrl();
  diffCtrl = new DiffCtrl();

  sync = (req, res) => {
    this.logs = [];
    this._cleanup().then(() => {
      this._queryConfluence().then(() =>
        this._queryPMO().then(() => {
          Promise.all([
            this._queryBamboo(),
            this._queryDemand()
          ]).then(() => {
            res.setHeader('Content-Type', 'application/json');
            res.json(this.logs);
          });
        })
      )
    }).catch(() => res.sendStatus(500));
  };

  private _addLog(text, source='') {
    let message = (source && source + ': ') + text;
    this.logs.push(message);
    console.log(message);
  }

  private _cleanup(): Promise<any> {
    return new Promise((resolve, reject) => {
      Initiative.deleteMany({}, err => {
        if (err) return reject(err);
        Resource.deleteMany({}, err => {
          if (err) return reject(err);
          Assignment.deleteMany({}, err => {
            if (err) return reject(err);
            Demand.deleteMany({}, err => {
              if (err) return reject(err);
              return resolve();
            })
          });
        });
      });
    });
  };

  private _fakeRes(callback: Function) {
    return {
      setHeader: () => {},
      send: (data, err) => {
        // console.log('Text', data);
        callback(JSON.parse(data), err);
      },
      json: (data, err) => {
        // console.log('JSON', data);
        callback(data, err);
      }
    };
  }

  private _makeDate(milliseconds: number): string {
    if (!milliseconds) return '';
    return new Date(milliseconds).toString();
  }

  private _queryBamboo(): Promise<any> {
    let todayYear = new Date().getFullYear();
    this.loadings['bamboo'] = true;
    return new Promise((resolve, reject) => {
      // Request timeoffs from the Bamboo
      this.integrationsCtrl.bambooTimeoff({}, this._fakeRes((data, err) => {
        this._addLog('Received vacations information', 'Bamboo');

        if (err) return reject(err);

        // Create new Vacation initiative
        new Initiative({
          name: 'Vacation',
          account: 'Griddynamics',
          color: '#1ca1c0'
        }).save((err, vacation) => {
          // ... and save it
          if (err) return reject(err);

          let vacationId = vacation._id;
          // Create custom method to add vacation assignment to resource
          let addVacation = (resourceId, startDate, endDate) => {
            // console.log('add vacation', resourceId, startDate, endDate);
            let vac = new Assignment({
              initiativeId: vacationId,
              resourceId,
              start: startDate,
              end: endDate,
              billability: 'Non-billable',
              involvement: 100
            });
            vac.save(err => reject(err));
          };

          let vacationRequests = {};
          let vacationsCount = 0;
          // For each timeoff
          data.requests.request.forEach(request => {
            // ... try to find corresponding resource
            let name = request.employee['$t'];
            let resource = this._peopleByName[name];
            if (!resource) {
              this._addLog('Unable to add vacations for ' + name, 'Bamboo');
              return;
            }
            let endYear = new Date(request.end).getFullYear();
            if (todayYear - endYear > 1) return;

            // Add vacation if it is approved
            if (request.status && request.status['$t'] === 'approved') {
              addVacation(resource._id, request.start, request.end);
              vacationsCount++;
            }
          });
          this._addLog(vacationsCount + ' vacation records created', 'Bamboo');
          this.loadings['bamboo'] = false;
          return resolve();
        });
      }));
    });
  }

  private _queryPMO(): Promise<any> {
    this.loadings['pmo'] = true;
    let initiativesIds = {};
    let profilesCreated = 0;
    let hue = 0;

    return new Promise((resolve, reject) => {
      // Get visas information
      return this.integrationsCtrl.confluenceGetVisas({}, this._fakeRes((visas, err) => {
        if (err) return reject(err);
        let records = Object.keys(visas).length;
        // Duplicating visas data for both FirstName_LastName and LastName_FirstName
        visas = Object.assign(visas, Object.keys(visas).reduce((result, name) => {
          let [first, last] = name.split(' ');
          let mena = last +  ' ' + first;
          result[mena] = visas[name];
          return result;
        }, {}));
        this._addLog(records + ' records fetched', 'Visas');

        // Get people from PMO
        return this.integrationsCtrl.pmoGetPeople({}, this._fakeRes((data, err) => {
          let initiatives = {};
          let initiativesCreators = {};
          let assignments = [];

          // console.log(data);
          this._addLog(data.rows.length + ' records received', 'PMO');
          let peopleSorted = data.rows.sort((a, b) => (a.name > b.name) ? 1 : -1);

          // For every person
          peopleSorted.forEach(person => {
            // ... determine the pool they belong to
            let pool;
            if (profilesInvertedMap[person.workProfile]) {
              pool = profilesInvertedMap[person.workProfile][person.specialization];
            }
            if (!pool) {
              pool = '';
            }

            let who = this._whois[person.employeeId] || {};
            let visa = visas[person.fullName] || {};

            let resource = new Resource({
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
              room: who.room,
              passport: visa.passport,
              visaB: visa.visaB,
              visaL: visa.visaL,
              license: visa.license
            });

            profilesCreated++;

            // Save the person
            // TODO: use login as an ID
            return resource.save((err, resource) => {
              if (err) return reject(err);
              // this._addLog('Created profile for ' + resource.name);

              let name = resource.name.split(' ').reverse().join(' ');
              this._peopleByName[resource.name] = resource;
              this._peopleByName[name] = resource;

              // No assignments to accounts - continue
              if (!person.account) return;

              // Map this person to accounts they assigned
              person.account.forEach((account, index) => {
                let project = person.project[index];
                let name = account + ':' + project;
                let assignment = {
                  resourceId: resource._id,
                  name: project,
                  account,
                  start: this._makeDate(person.assignmentStart[index]),
                  end: this._makeDate(person.assignmentFinish[index]),
                  billability: person.assignmentStatus[index].name,
                  involvement: person.involvements[index]
                };
                // Keep all accounts met
                this._accounts[account] = true;

                // Store all initiative creation promises to avoid duplication
                let initiative = initiativesCreators[name] as Promise<any>;
                if (initiative) {
                  // Initiative has been created already, its ID can be added to the
                  // newly created assignment
                  initiative.then(() => {
                    assignment['initiativeId'] = initiatives[name]._id;
                    new Assignment(assignment).save();
                  });
                } else {
                  // ... otherwise new Initiative should be created
                  hue = (hue + 10) % 360;
                  let initiative = {
                    name: project,
                    account,
                    color: '#' + convert.hsl.hex(hue, 50, 80)
                  };
                  initiativesCreators[name] = new Promise((resolve1, reject1) => {
                    new Initiative(initiative).save((err, initiative) => {
                      if (err) return reject1(err);
                      resolve1(initiative);
                    });
                  }).then((initiative: any) => {
                    initiatives[name] = initiative;
                    assignment['initiativeId'] = initiative._id;
                    new Assignment(assignment).save();
                  });
                }
              });
              return resolve();
            });
          });
          this._addLog(profilesCreated + ' profiles created', 'PMO');
        }));
      }));
    });
  }

  private _parseDate(date: string): Date {
    let d = date.replace(/[^\da-zA-Z\-\s]/g, ' ').replace(/\s+/g, ' ');
    return d ? new Date(d) : null;
  }

  private _parseDuration(duration: string): number {
    duration = duration.replace(/[^\d-]/g, '').substr(0, 2);
    duration = duration.split('-')[0];    // 6-9 months range
    return duration ? parseInt(duration) : 6;
  }

  private _leadingZero(index: number): string {
    return (index > 9 ? '' : '0') + index;
  }

  private _queryDemand(): Promise<any> {
    this.loadings['demands'] = true;

    // Create new initiative to show demand
    new Initiative({
      name: 'Demand',
      account: 'Griddynamics',
      color: '#FF5050'
    }).save();

    return new Promise((resolve, reject) => {
      // Query Demand file
      return this.integrationsCtrl.googleGetInfo({}, this._fakeRes((data, err) => {
        this._addLog(data.length + ' records received', 'Demand');
        let demandAccountIndex = {};

        // For each line of demand file
        data.forEach((demandLine, index) => {
          // ... parse its cells
          let start = this._parseDate(demandLine[8]);
          let duration = this._parseDuration(demandLine[10]);
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

          let account = demandLine[1];
          if (!this._accounts[account]) {
            if (accountsMap[account]) {
              account = accountsMap[account];
            } else {
              this._addLog('Unknown account - ' + account, 'Demand');
            }
          }
          demandAccountIndex[account] = (demandAccountIndex[account] || 0) + 1;

          let demandLocations = demandLine.slice(12, 18);
          let l = locations.filter((location, index) => !!demandLocations[index]);

          let profile = demandLine[5];
          let pool = demandProfilesMap[profile] || '';

          let requestId = demandLine[18];
          requestId = !requestId.indexOf('GD') ? requestId : '';

          let demand = {
            row: account + this._leadingZero(demandAccountIndex[account]),
            account,
            status: demandLine[2],
            acknowledgement: demandLine[3],
            role: replaceFromMap(billabilityMap, demandLine[4]),
            profile,
            pool,
            comment: demandLine[6],
            deployment: demandLine[7],
            start,
            end,
            stage: demandLine[9],
            grades: demandLine[11].split(/[,-]/g),
            locations: l,
            requestId
          };

          let lcProfile = profile.toLowerCase();
          if (demand.status !== 'active') return;
          // this.addLog('Created demand for ' + demand.account);

          setTimeout(() => new Demand(demand).save((err, data) => reject(err)), index);
        });
        this.loadings['demands'] = false;
        return resolve();
      }));
    });
  }

  private _queryConfluence(): Promise<any> {
    this.loadings['whois'] = true;
    return new Promise((resolve, reject) => {
      this.integrationsCtrl.confluenceGetWhois({}, this._fakeRes((whois, err) => {
        if (err) return reject(err);

        this._addLog(whois.length + ' records received', 'Whois');

        this._whois = whois.reduce((result, u) => {
          let [pool, name, account, initiative, profile, grade, manager, location, skype, phone, room, login] = u;
          result[login] = {manager, skype, phone, room};
          return result;
        }, {});
        this.loadings['whois'] = false;

        return resolve();
      }))
    });
  };
}
