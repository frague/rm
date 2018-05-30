import Initiative from '../models/initiative';
import Resource from '../models/resource';
import Assignment from '../models/assignment';
import Demand from '../models/demand';
import Candidate from '../models/candidate';
import Requisition from '../models/requisition';

import PmoIntegrationsCtrl from './integrations/pmo';
import ConfluenceIntegrationsCtrl from './integrations/confluence';
import BambooIntegrationsCtrl from './integrations/bamboo';
import JobViteIntegrationsCtrl from './integrations/jobvite';

import { IO } from '../io';
import { fakeRes } from './fakeresponse';

import * as convert from 'color-convert';
// import * as Confluence from 'confluence-api';
import {
  replaceFromMap,
  accountsMap,
  billabilityMap,
  locationsMap,
  locations,
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

  private _peopleByName = {};
  private _accounts = {};
  private _whois = {};
  private _timers = {};
  private _tasks = [];
  private _visas = {};
  private _stati = {};
  private _threads = {};

  PMO = new PmoIntegrationsCtrl();
  wiki = new ConfluenceIntegrationsCtrl();
  bamboo = new BambooIntegrationsCtrl();
  jv = new JobViteIntegrationsCtrl();

  private _isTaskEnabled(name: string) {
    return this._tasks.includes(name);
  }

  private _addLog(text, source='') {
    let message = (source && source + ': ') + text;
    this.logs.push(message);
    console.log(message);
    IO.client().emit('message', message);
  }

  private _sendStatus(task: string, status: string) {
    console.log(task, '->', status);
    this._stati[task] = status;
    IO.client().emit('status', [task, status]);
  }

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

  private _setTimer(task, validate=true): boolean {
    if (validate && !this._isTaskEnabled(task)) {
      console.log(task, 'sync is skipped');
      this._sendStatus(task, 'skipped');
      return false;
    }
    this._timers[task] = new Date().getTime();
    this._addLog(task + ' sync has started');
    this._sendStatus(task, 'progress');
    return true;
  }

  private _getDelay(task, validate=true): void {
    let initial = this._timers[task];
    let ms = initial ? ' in ' + Math.ceil((new Date().getTime() - initial) / 1000) + 's' : '';
    this._addLog(task + ' sync is completed' + ms);
    if (this._stati[task] !== 'error') {
      this._sendStatus(task, 'done');
    }
  }

  private _setError(task, error) {
    this._addLog(task + ' syncing error');
    this._sendStatus(task, 'error');
    console.log('Error executing task', task, error);
  }

  private _finishOverall(task) {
    delete this._threads[task];
    if (Object.keys(this._threads).length === 0) {
      this._getDelay('overall');
      this._addLog('done');
    }
  }

  sync = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.sendStatus(200);

    this._tasks = (req.body.tasks || '').split(',');
    this._tasks.forEach(task => this._sendStatus(task, 'pending'));

    this._timers = {};
    this._stati = {};
    this._threads = {};
    this._setTimer('overall', false);
    try {
      this.logs = [];

      // JobVite requisitions
      if (this._setTimer('requisitions')) {
        this._threads['requisitions'] = true;
        await Requisition.deleteMany({});
        this._queryRequisitions()
          .then(async (requisitionIds: string[]) => {
            this._getDelay('requisitions')

            // JobVite candidates
            if (this._setTimer('candidates')) {
              await Candidate.deleteMany({});
              await this._queryCandidates(requisitionIds)
                .then(() => this._getDelay('candidates'))
                .catch(err => this._addLog('error syncing candidates: ' + err));
            }
          })
          .catch(error => this._setError('requisitions', error))
          .then(() => this._finishOverall('requisitions'));
      }

      // Demand in PMO
      if (this._setTimer('demand')) {
        this._threads['demand'] = true;
        await Demand.deleteMany({});
        this._queryDemand()
          .then(() => {
            this._getDelay('demand');
          })
          .catch(error => {
            this._setError('demand', error);
          })
          .then(() => this._finishOverall('demand'));
      }

      // Users
      if (this._setTimer('users')) {
        this._threads['users'] = true;

        await Resource.deleteMany({});
        await Initiative.deleteMany({
          name: {
            '$nin': ['Demand', 'Vacation']
          }
        });
        await Assignment.deleteMany({});

        // Visas in wiki (passport, visa type, expiration)
        if (this._setTimer('visas')) {
          this._visas = {};
          await this._queryVisas()
            .catch(error => this._setError('visas', error));
          this._getDelay('visas');
        }

        // Whois in wiki (skype id, room, etc.)
        if (this._setTimer('whois')) {
          await this._queryConfluence()
            .catch(error => this._setError('whois', error));
          this._getDelay('whois');
        }

        // Employees and their assignments
        if (this._setTimer('assignments')) {
          await this._queryPMO()
            .catch(error => this._setError('assignments', error));
          this._getDelay('assignments');
        }

        // Vacations in bamboo
        if (this._setTimer('vacations')) {
          await this._queryBamboo()
            .catch(error => this._setError('vacations', error));
          this._getDelay('vacations');
        }
        this._getDelay('users');
        this._finishOverall('users');
      }
    } catch (e) {
      this._setError('overall', e);
    }
  };

  private _queryBamboo(): Promise<any> {
    let todayYear = new Date().getFullYear();
    let notFound = {};
    return new Promise(async (resolve, reject) => {
      try {
        // Request timeoffs from the Bamboo
        let data = await this.bamboo.getTimeoffs().catch(reject);
        this._addLog('received vacations information', 'bamboo');

        // Create new Vacation initiative
        let _error;
        let vacation = await Initiative.findOne(
          {name: 'Vacation'},
          async (error, data) => {
            if (error) {
              _error = error;
              return;
            }
            if (!data) {
              return await new Initiative({
                name: 'Vacation',
                account: 'Griddynamics',
                color: '#1ca1c0'
              }).save();
            } else {
              return data;
            }
          }
        );

        new Initiative({
          name: 'Vacation',
          account: 'Griddynamics',
          color: '#1ca1c0'
        }).save((err, vacation) => {
          // ... and save it
          if (err) {
            return reject(err);
          }
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
            vac.save(reject);
          };

          let vacationRequests = {};
          let vacationsCount = 0;
          // For each timeoff
          data.requests.request.forEach(request => {
            // ... try to find corresponding resource
            let name = request.employee['$t'];
            let resource = this._peopleByName[name];
            if (!resource) {
              if (!notFound[name]) {
                this._addLog('unable to add vacations for ' + name, 'bamboo');
                notFound[name] = true;
              }
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
          this._addLog(vacationsCount + ' vacation records created', 'bamboo');
          return resolve();
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  private async _queryVisas(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        // Get visas information
        let visas = await this.wiki.getVisas().catch(reject);
        let records = Object.keys(visas).length;

        // Duplicating visas data for both FirstName_LastName and LastName_FirstName
        visas = Object.assign(visas, Object.keys(visas).reduce((result, name) => {
          let [first, last] = name.split(' ');
          result[last +  ' ' + first] = visas[name];
          return result;
        }, {}));
        this._addLog(records + ' records fetched', 'visas');
        resolve(visas);
      } catch (error) {
        console.log('Error fetching visas from the wiki');
        reject(error);
      }
    });
  }

  private async _queryPMO(): Promise<any> {
    let initiativesIds = {};
    let profilesCreated = 0;
    let hue = 0;

    return new Promise(async (resolve, reject) => {
      try {
        // Get people from PMO
        let _error;
        let data = await this.PMO.getPeople().catch(error => _error = error);
        if (_error) {
          return reject(_error);
        }

        let initiatives = {};
        let initiativesCreators = {};
        let assignments = [];

        this._addLog(data.length + ' records received', 'pmo');
        let peopleSorted = data.sort((a, b) => (a.name > b.name) ? 1 : -1);

        let pools = {};

        // For every person
        peopleSorted.forEach(person => {
          // ... determine the pool they belong to
          let ems = person['engineerManagers'];
          let pool = (ems && ems.length) ? ems[0].discipline : '';
          if (!pools[pool]) {
            console.log('*', pool);
            pools[pool] = true;
          }

          let who = this._whois[person.username] || {};
          let visa = this._visas[person.name] || {};

          let resource = new Resource({
            name: person.name,
            login: person.username,
            grade: person.grade,
            location: locationsMap[person.location],
            profile: person.workProfile,
            specialization: person.specialization,
            pool,
            manager: person.manager,
            benchDays: person.daysOnBench,
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
            if (!person.assignments) return;

            // Map this person to accounts they assigned
            person.assignments.forEach(involvement => {
              let project = involvement.project;
              let account = involvement.account;
              let name = account + ':' + project;
              let assignment = {
                resourceId: resource._id,
                name: project,
                account,
                start: this._makeDate(involvement.start),
                end: this._makeDate(involvement.end, true),
                billability: involvement.status,
                involvement: involvement.involvement,
                comment: involvement.comment
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
        this._addLog(profilesCreated + ' profiles created', 'pmo');
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

  private _queryDemand(): Promise<any> {
    // Create new initiative to show demand (if not exists)
    Initiative.findOne(
      {name: 'Demand'},
      (err, data) => {
        if (err || !data) {
          new Initiative({
            name: 'Demand',
            account: 'Griddynamics',
            color: '#FF5050'
          }).save();
        }
      }
    );

    return new Promise(async (resolve, reject) => {
      let _error;
      let data = await this.PMO.getDemandDicts().catch(error => _error = error);
      if (_error) {
        return reject(_error);
      }

      let { load, locations, accounts, grades, workProfiles, stages, types, statuses } = data;
      let destinations = data['deploy-destinations'];

      const specializations = Object.values(workProfiles).reduce((result, profile: any) => {
        profile.specializations.forEach(spec => result[spec.id] = spec);
        return result;
      }, {});

      const transformLocations = (item, locations) => {
        return item.locations.map(lid => {
          const name = locations[lid].name;
          return locationsMap[name] || name;
        }).sort().join(', ');
      };

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
          login: id + ':' + specs + '_' + profile + '_for_' + account.replace(/[ .:]/g, '_'),
          name: id + '. ' + specs + ' ' + profile,
          account: account,
          comment: item.comment,
          candidates: item.proposedCandidates.join(', '),
          deployment: destinations[item.deployDestinationId].name,
          end: end.toISOString().substr(0, 10),
          grades: item.gradeRequirements.map(rid => {
            let grade = grades[rid];
            return grade ? (grade.code + grade.level) : '?';
          }).sort().join(', '),
          locations: transformLocations(item, locations),
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

      return resolve();
    });
  }

  private _queryConfluence(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        let whois: any[] = await this.wiki.getWhois().catch(reject);

        this._addLog(whois.length + ' records fetched', 'whois');

        this._whois = whois.reduce((result, u) => {
          let [pool, name, account, initiative, profile, grade, manager, location, skype, phone, room, login] = u;
          result[login] = { manager, skype, phone, room };
          return result;
        }, {});

        return resolve();
      } catch (e) {
        reject(e);
      }
    });
  };

  private _queryRequisitions(): Promise<string[]> {
    let result = [];
    return new Promise(async (resolve, reject) => {
      let _error;
      let data = await this.jv.getRequisitions().catch(error => _error = error);
      if (_error || !data) {
        console.log('Unable to fetch requisitions', _error);
        return reject(_error);
      }

      this._addLog(data.length + ' requisitions fetched', 'jobvite');
      try {
        data.forEach(req => {
          new Requisition(req).save();
          result.push(req.requisitionId);
        })
        resolve(result);
      } catch (e) {
        console.log('Unable to parse requisitions', e);
        reject(e);
      }
    });
  }

  private async _jvGetCandidatesChunk(start: number, allowedRequisitions: string[], resolve, reject) {
    const diapasone = '[' + start + '÷' + (start + candidatesChunk) + ']';
    let _error;
    let data = await this.jv.getCandidates(start, candidatesChunk).catch(error => _error = error);
    if (_error) {
      console.log('Unable to fetch JobVite candidates chunk ' + diapasone, _error);
      return reject(_error);
    };

    this._addLog('Candidates chunk fetched ' + diapasone, 'jobvite');
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
    return new Promise(async (resolve, reject) => {
      let _error;
      let count: number = await this.jv.getCandidatesCount().catch(error => _error = error);
      if (_error) {
        this._addLog('Error fetching candidates count', _error);
        return reject(_error);
      };

      let fetchers = new Array(40).join('.').split('.').map((x, i) =>
        new Promise((res, rej) =>
          // Using timeout to overcome calls per second API limitation
          setTimeout(() => this._jvGetCandidatesChunk(count - candidatesChunk * (i + 1), requisitionIds, res, rej), 5000 * i)
        ));

      Promise.all(fetchers)
        .then(resolve)
        .catch(reject);
    });
  }
}
