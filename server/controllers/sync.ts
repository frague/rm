import Initiative from '../models/initiative';
import Resource from '../models/resource';
import Assignment from '../models/assignment';
import Demand from '../models/demand';
import Candidate from '../models/candidate';
import Requisition from '../models/requisition';

import IntegrationsCtrl from './integrations';
import { IO } from '../io';
import { fakeRes } from './fakeresponse';

import * as convert from 'color-convert';
import * as Confluence from 'confluence-api';
import {
  replaceFromMap,
  accountsMap,
  billabilityMap,
  locationsMap,
  locations,
  profilesInvertedMap,
  demandProfilesMap,
  demandPoolsMap,
  candidateStates
} from '../mappings';

const candidatesChunk = 500;
const cleanupLocation = new RegExp(/(^,\s*|,\s*$)/);
const outdated = 1000 * 60 * 60 * 24 * 30 * 3;  // 3 months

export default class SyncCtrl {

  data: any = [];
  logs = [];
  loadings = {};

  private _peopleByName = {};
  private _accounts = {};
  private _whois = {};
  private _timers = {};

  integrationsCtrl = new IntegrationsCtrl();

  private _setTimer(name) {
    this._timers[name] = new Date().getTime();
    this._addLog(name + ' has started');
  }

  private _getDelay(name) {
    let initial = this._timers[name];
    let ms = initial ? ' in ' + (new Date().getTime() - initial) + 'ms' : '';
    this._addLog(name + ' is completed' + ms);
  }

  sync = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.sendStatus(200);

    this._timers = {};
    this._setTimer('Synchronization');
    try {
      this.logs = [];
      this._setTimer('Cleanup');
      await this._cleanup();
      this._getDelay('Cleanup');

      this._setTimer('Requisitions sync');
      this._queryRequisitions()
        .catch(err => this._addLog('Error syncing requisitions: ' + err))
        .then((requisitionIds: string[]) => {
          this._getDelay('Requisitions sync')

          this._setTimer('Candidates sync');
          this._queryCandidates(requisitionIds)
            .catch(err => this._addLog('Error syncing candidates: ' + err))
            .then(() => this._getDelay('Candidates sync'));
        });

      this._setTimer('Confluence (whois) sync');
      await this._queryConfluence();
      this._getDelay('Confluence (whois) sync');

      this._setTimer('PMO and visas sync');
      await this._queryPMO();
      this._getDelay('PMO and visas sync');

      this._setTimer('Bamboo (vacations) sync');
      await this._queryBamboo();
      this._getDelay('Bamboo (vacations) sync');

      delete this._peopleByName;
      this._peopleByName = {};
      delete this._whois;
      this._whois = {};

      this._setTimer('Demand sync');
      await this._queryPMODemand();
      this._getDelay('Demand sync');
    } catch (e) {
      this._addLog(e, 'Error');
    }
    this._getDelay('Synchronization');
    this._addLog('Done');
  };

  private _addLog(text, source='') {
    let message = (source && source + ': ') + text;
    this.logs.push(message);
    console.log(message);
    IO.client().emit('message', message);
  }

  private async _cleanup() {
    await Initiative.deleteMany({});
    await Resource.deleteMany({});
    await Assignment.deleteMany({});
    await Demand.deleteMany({});
    await Requisition.deleteMany({});
    await Candidate.deleteMany({});
  };

  private _makeDate(milliseconds: number, eod=false): string {
    if (!milliseconds) return '';
    let result = new Date(milliseconds);
    if (eod) {
      result.setHours(23);
      result.setMinutes(59);
      result.setSeconds(59);
    }
    return result.toString()
  }

  private _queryBamboo(): Promise<any> {
    let todayYear = new Date().getFullYear();
    this.loadings['bamboo'] = true;
    return new Promise((resolve, reject) => {
      try {
        // Request timeoffs from the Bamboo
        this.integrationsCtrl.bambooTimeoff({}, fakeRes((data, err) => {
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
      } catch (e) {
        reject(e);
      }
    });
  }

  private _queryPMO(): Promise<any> {
    this.loadings['pmo'] = true;
    let initiativesIds = {};
    let profilesCreated = 0;
    let hue = 0;

    return new Promise((resolve, reject) => {
      try {
        // Get visas information
        return this.integrationsCtrl.confluenceGetVisas({}, fakeRes((visas, err) => {
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
          return this.integrationsCtrl.pmoGetPeople({}, fakeRes((data, err) => {
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
                    end: this._makeDate(person.assignmentFinish[index], true),
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
      } catch (e) {
        reject(e);
      }
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

  private _queryPMODemand(): Promise<any> {
    this.loadings['demands'] = true;

    // Create new initiative to show demand
    new Initiative({
      name: 'Demand',
      account: 'Griddynamics',
      color: '#FF5050'
    }).save();

    return new Promise(async (resolve, reject) => {
      this.integrationsCtrl.pmoGetDemandDicts({}, fakeRes((data: any, err) => {
        let {load, locations, accounts, grades, workProfiles, stages, types, statuses} = data;
        let destinations = data['deploy-destinations'];

        const specializations = Object.values(workProfiles).reduce((result, profile: any) => {
          profile.specializations.forEach(spec => result[spec.id] = spec);
          return result;
        }, {});

        Object.keys(load).forEach(id => {
          let item = load[id];

          const account = item.account.name;
          const end = new Date(item.startDate);
          end.setMonth(end.getMonth() + item.duration);
          const profile = workProfiles[item.workProfileId].name;
          const status = statuses[item.statusId].name;
          const specs = item.specializations.map(sid => specializations[sid].name).join(', ');
          const pool = demandPoolsMap[profile + '-' + specs] || '';


          let demand = {
            login: id + ':' + specs + '_' + profile + '_for_' + account.replace(' ', '_'),
            account: account.name,
            comment: item.comment,
            candidates: item.proposedCandidates.join(', '),
            deployment: destinations[item.deployDestinationId].name,
            end: end.toISOString().substr(0, 10),
            grades: item.gradeRequirements.map(rid => {
              let grade = grades[rid];
              return grade ? (grade.code + grade.level) : '?';
            }).sort().join(', '),
            locations: item.locations.map(lid => locations[lid].name).sort().join(', '),
            profile,
            project: item.project.name,
            role: types[item.typeId].billableStatus,
            start: item.startDate,
            specializations: specs,
            stage: stages[item.stageId].code,
            requestId: item.jobviteId,

            pool
          };

          if (status === 'Active') {
            setTimeout(() => new Demand(demand).save((err, data) => {
              if (err) reject(err);
            }), 0);
          }

        });

        this.loadings['demands'] = false;
        return resolve();
      }));
    })
      .catch(err => console.log(err));
  }


  private _queryDemand(): Promise<any> {
    this.loadings['demands'] = true;

    // Create new initiative to show demand
    new Initiative({
      name: 'Demand',
      account: 'Griddynamics',
      color: '#FF5050'
    }).save();

    return new Promise(async (resolve, reject) => {
      // Query Demand file
      let sheet: any = await this.integrationsCtrl.googleGetSheet();
      let rowsCount = sheet.rowCount;
      this._addLog(rowsCount + ' records received', 'Demand');
      let demandAccountIndex = {};

      let row = 8; // Min row
      let offset = 500; // Rows fits into memory at once

      while (row < rowsCount) {
        let maxRow = (row + offset > rowsCount) ? rowsCount : row + offset;
        this._addLog('Reading demand sheet lines range [' + row + '÷' + maxRow + ']', 'Demand');
        let data = await this.integrationsCtrl.getSheetPortion(sheet, row, maxRow);
        row = maxRow + 1;

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
              this._accounts[account] = true;
            }
          }
          demandAccountIndex[account] = (demandAccountIndex[account] || 0) + 1;

          let login = (account + this._leadingZero(demandAccountIndex[account])).replace(/\./g, '_');
          let demandLocations = demandLine.slice(12, 18);
          let l = locations.filter((location, index) => !!demandLocations[index]).sort().join(', ');

          let profile = demandLine[5];
          let pool = demandProfilesMap[profile] || '';

          let requestId = demandLine[18];
          requestId = !requestId.indexOf('GD') ? requestId : '';

          let status = demandLine[2];

          let demand = {
            login,
            account,
            acknowledgement: demandLine[3],
            role: replaceFromMap(billabilityMap, demandLine[4]),
            profile,
            pool,
            comment: demandLine[6],
            deployment: demandLine[7],
            start,
            end,
            stage: demandLine[9],
            grades: demandLine[11].split(/[,-]/g).sort().join(', '),
            locations: l,
            requestId
          };

          if (status === 'active') {
            setTimeout(() => new Demand(demand).save((err, data) => {
              if (err) reject(err);
            }), 0);
          }
        })
      };

      this.loadings['demands'] = false;
      return resolve();
    })
      .catch(err => console.log(err));
  }

  private _queryConfluence(): Promise<any> {
    this.loadings['whois'] = true;
    return new Promise((resolve, reject) => {
      try {
        this.integrationsCtrl.confluenceGetWhois({}, fakeRes((whois, err) => {
          if (err) return reject(err);

          this._addLog(whois.length + ' records fetched', 'Whois');

          this._whois = whois.reduce((result, u) => {
            let [pool, name, account, initiative, profile, grade, manager, location, skype, phone, room, login] = u;
            result[login] = {manager, skype, phone, room};
            return result;
          }, {});
          this.loadings['whois'] = false;

          return resolve();
        }))
      } catch (e) {
        this.loadings['whois'] = false;
        reject(e);
      }
    });
  };

  private _queryRequisitions(): Promise<string[]> {
    this.loadings['jvr'] = true;
    let result = [];
    return new Promise((resolve, reject) => {
      try {
        this.integrationsCtrl.jvGetRequisitions({}, fakeRes((data, err) => {
          if (err) {
            console.log('Unable to fetch requisitions', err);
            reject(err);
          }
          this._addLog(data.length + ' requisitions fetched', 'JobVite');
          data.forEach(req => {
            new Requisition(req).save();
            result.push(req.requisitionId);
          })
          this.loadings['jvr'] = false;
          resolve(result);
        }));
      } catch (e) {
        this.loadings['jvr'] = false;
        console.log('Unable to parse requisitions', e);
        reject(e);
      }
    });
  }

  private async _jvGetCandidatesChunk(start: number, allowedRequisitions: string[], resolve, reject) {
    let data = await this.integrationsCtrl.jvGetCandidates(start, candidatesChunk)
      .catch(err => {
        console.log(err);
        reject(err);
        return [];
      });
    this._addLog('Candidates chunk fetched [' + start + '÷' + (start + candidatesChunk) + ']', 'JobVite');
    let now = new Date().getTime();
    data.forEach((candidate, index) => {
      let name = candidate.lastName + ' ' + candidate.firstName;
      let job = candidate.job || {};
      let application = candidate.application || {};
      let applicationJob = application.job || {};
      let state = candidateStates[application.workflowState];
      let requisitionId = applicationJob.requisitionId || '';
      let login = (candidate.firstName + '_' + candidate.lastName).toLowerCase().replace(/\./g, '_') + '-' + requisitionId;
      let updated = application.lastUpdatedDate ? new Date(application.lastUpdatedDate) : null;

      let nc = new Candidate({
        login,
        name,
        country: candidate.country,
        city: candidate.city,
        location: candidate.location.replace(cleanupLocation, ''),
        profile: candidate.title,
        requisitionId,
        state: state || application.workflowState,
        updated: updated ? updated.toISOString().substr(0, 10) : null,
        applicationId: application.eId
      });

      if (
        nc.state.indexOf('Rejected') < 0
        && nc.requisitionId
        && allowedRequisitions.includes(nc.requisitionId)
        && updated
        && (now - updated.getTime()) < outdated
      ) {
        nc.save();
      }
    });
    resolve();
  }

  private _queryCandidates(requisitionIds: string[]): Promise<any> {
    this.loadings['jvc'] = true;
    return new Promise(async (resolve, reject) => {
      let count: number = await this.integrationsCtrl.jvGetCandidatesCount()
        .catch(err => {
          this._addLog('Error fetching candidates count');
          reject(err);
          return 0;
        });

        let fetchers = new Array(40).join('.').split('.').map((x, i) =>
          new Promise((res, rej) =>
            // Using timeout to overcome calls per second API limitation
            setTimeout(() => this._jvGetCandidatesChunk(count - candidatesChunk * (i + 1), requisitionIds, res, rej), 5000 * i)
          ));
        Promise.all(fetchers)
          .catch(err => {
            this.loadings['jvc'] = false;
            reject(err)
          })
          .then(() => {
            this.loadings['jvc'] = false;
            resolve();
          });
    })
      .catch(err => console.log(err));
  }
}
