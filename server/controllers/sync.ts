import Initiative from '../models/initiative';
import Resource from '../models/resource';
import Assignment from '../models/assignment';
import Demand from '../models/demand';
import Candidate from '../models/candidate';
import Requisition from '../models/requisition';
import RequisitionDemand from '../models/requisitionDemand';

import PmoIntegrationsCtrl from './integrations/pmo';
import ConfluenceIntegrationsCtrl from './integrations/confluence';
import BambooIntegrationsCtrl from './integrations/bamboo';
import JobViteIntegrationsCtrl from './integrations/jobvite';

import { IO } from '../io';
import { fakeRes } from './fakeresponse';

import { usPriorities } from './htmlparser';

import * as convert from 'color-convert';
import {
  replaceFromMap,
  accountsMap,
  billabilityMap,
  locationsMap,
  locations,
  demandProfilesMap,
  demandPoolsMap,
  candidateStates,
  profilesInvertedMap,
  requisitionsLocations
} from '../mappings';

const candidatesChunk = 500;
const requisitionsChunk = 500;
const cleanupLocation = new RegExp(/(^,\s*|,\s*$)/);
const outdated = 1000 * 60 * 60 * 24 * 30 * 3;  // 3 months
const reqId = new RegExp(/^.*(GD\d+).*$/, 'i');

export default class SyncCtrl {

  data: any = [];
  logs = [];

  private _peopleByName = {};
  private _accounts = {};
  private _whois = {};
  private _timers = {};
  private _tasks = [];
  private _visas = {};
  private _prs = {};
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

    this._tasks = [];
    this._timers = {};
    this._stati = {};
    this._threads = {};

    this._tasks = (req.body.tasks || '').split(',');
    this._tasks.forEach(task => this._sendStatus(task, 'pending'));

    this._setTimer('overall', false);
    try {
      this.logs = [];

      // JobVite requisitions
      if (this._setTimer('requisitions')) {
        this._threads['requisitions'] = true;
        await Requisition.deleteMany({});
        this._queryRequisitions()
          .then(async (requisitionIds: string[]) => {
            this._getDelay('requisitions');
            // console.log(JSON.stringify(requisitionIds));

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

        // Visas in wiki (passport, visa type, expiration)
        if (this._setTimer('visas')) {
          this._visas = await this._queryVisas()
            .catch(error => this._setError('visas', error));
          this._getDelay('visas');
        }

        // Next PR date, pay rates, visas status in bamboo
        if (this._setTimer('pr')) {
          this._prs = await this._queryPRs()
            .catch(error => this._setError('pr', error));
          this._getDelay('pr');
        }

        // Whois on wiki (skype id, room, etc.)
        if (this._setTimer('whois')) {
          this._whois = await this._queryConfluence()
            .catch(error => this._setError('whois', error));
          this._getDelay('whois');
        }

        // Employees and their assignments
        if (this._setTimer('assignments')) {
          await this._queryUsers()
            .catch(error => this._setError('assignments', error));
          this._getDelay('assignments');
        }

        // Vacations in bamboo
        if (this._setTimer('vacations')) {
          await this._queryVacations()
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

  private _queryVacations(): Promise<any> {
    let todayYear = new Date().getFullYear();
    let notFound = {};
    return new Promise(async (resolve, reject) => {
      try {
        // Create new Vacation initiative
        let _error;

        Initiative.findOne(
          { _id: 'vacation' },
          (error, existingVacation) => {
            if (error) {
              _error = error;
              return;
            }
            if (!existingVacation) {
              new Initiative({
                _id: 'vacation',
                name: 'Vacation',
                account: 'Griddynamics',
                color: '#1ca1c0'
              })
                .save()
                .catch(error => _error = error);
            }
          }
        ).exec();

        if (_error) {
          return reject(_error);
        }

        // Request timeoffs from the Bamboo
        let data = await this.bamboo.getTimeoffs().catch(error => _error = error);
        if (_error) {
          return reject(_error);
        }

        await Assignment.deleteMany({ initiativeId: 'vacation' });

        this._addLog('received vacations information', 'bamboo');

        // Create custom method to add vacation assignment to resource
        let addVacation = (resourceId, startDate, endDate) => {
          // console.log('add vacation', resourceId, startDate, endDate);
          let vac = new Assignment({
            initiativeId: 'vacation',
            resourceId,
            start: startDate,
            end: endDate,
            billability: 'Funded',
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
              console.log('unable to add vacations for ' + name);
              notFound[name] = true;
            }
            return;
          }
          let endYear = new Date(request.end).getFullYear();
          if (todayYear - endYear > 1) return;

          // Add vacation if it is approved
          if (request.status && request.status['$t'] === 'approved') {
            addVacation(resource.login, request.start, request.end);
            vacationsCount++;
          }
        });
        this._addLog(vacationsCount + ' vacation records created', 'bamboo');
        return resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  private _queryPRs(): Promise<any> {
    return new Promise(async(resolve, reject) => {
      let _error;
      let prs = await this.bamboo.getPRs().catch(error => _error = error);
      if (_error) {
        return reject(_error);
      }
      try {
        prs = JSON.parse(prs)['employees']
          .filter(employee => !!employee.lastName)
          .reduce((result, employee) => {
            result[employee.lastName + ' ' + employee.firstName] = employee;
            return result;
          }, {});
          this._addLog(Object.keys(prs).length + ' employees records received', 'pr');
          resolve(prs);
      } catch (e) {
        console.log('Error parsing employees data', e);
        return reject(e);
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

  private _formatPayRate(source: string): string {
    return source.replace(/^(\d+)(\.\d+)/, '$1');
  }

  private async _queryUsers(): Promise<any> {
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

        // Read previous state of resources
        let prevState = await Resource.find({}).exec();
        prevState = prevState.reduce((result, resource) => {
          result[resource.login] = resource;
          return result;
        }, {});

        let syncVisas = this._isTaskEnabled('visas');
        let syncWhois = this._isTaskEnabled('whois');
        let syncPRs = this._isTaskEnabled('pr');

        await Resource.deleteMany({});
        await Initiative.deleteMany({
          _id: {
            '$nin': ['vacation', 'demand']
          }
        });
        await Assignment.deleteMany({
          initiativeId: {
            '$nin': ['vacation', 'demand']
          }
        });

        let initiatives = {};
        let initiativesCreators = {};
        let assignments = [];

        this._addLog(data.length + ' records received', 'pmo');
        const peopleSorted = data.sort((a, b) => (a.name > b.name) ? 1 : -1);

        // For every person
        peopleSorted.forEach(person => {
          // ... determine the pool they belong to
          const ems = person['engineerManagers'];
          const profile = person.profile;
          const specialization = (person.specialization || '').trim();
          const pool = (ems && ems.length) ?
            ems[0].discipline :
            ((profilesInvertedMap[profile] || {})[specialization] || '');
          const prev = prevState[person.username] || {};

          const who = (syncWhois ? this._whois[person.username] : prev) || {};
          const visa = (syncVisas ? this._visas[person.name] : prev) || {};
          let pr = prev;
          if (syncPRs) {
            let newPR = this._prs[person.name] || {};
            let visaType = newPR.customVisaType;
            let payRate = newPR.payRate;
            pr = {
              nextPr: this._makeDate(newPR.customPerformanceReviewDue),
              payRate: payRate && payRate.charAt(0) !== ' ' ? this._formatPayRate(payRate) : null,
              birthday: this._makeDate(newPR.dateOfBirth),
              bambooId: newPR.id,
            };

            // Visas are received from two sources: wiki and bamboo.
            // Latter contains more relevant information and should have higher priority
            if (visaType) {
              let activeVisa = {
                type: visaType,
                isUs: usPriorities[visaType] || 0,
                till: !!newPR.customVisaExpirationDate ? new Date(newPR.customVisaExpirationDate) : null
              };

              let updated = false;
              if (!visa.visas) {
                visa.visas = [];
              } else {
                visa.visas.forEach((v, index) => {
                  if (v.type === visaType) {
                    v.till = activeVisa.till;
                    updated = true;
                  }
                });
              }
              if (!updated) {
                visa.visas.push(activeVisa);
              }
            }
          }

          let resource = new Resource({
            name: person.name,
            login: person.username || person.name,
            grade: person.grade,
            location: locationsMap[person.location] || person.location,
            profile,
            specialization,
            onTrip: person.inBusinessTrip,
            pool,
            manager: person.manager,
            benchDays: person.daysOnBench,
            skype: who.skype,
            phone: who.phone,
            room: who.room,
            passport: visa.passport,
            visas: visa.visas,
            license: [1, '1', 'true'].includes(visa.license),
            nextPr: pr.nextPr,
            payRate: pr.payRate,
            birthday: pr.birthday,
            bambooId: pr.bambooId,
            pmoId: person.id,
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
                resourceId: resource.login,
                name: project,
                account,
                start: this._makeDate(involvement.start),
                end: this._makeDate(involvement.finish, true),
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
                let _id = (account + '_' + project).toLowerCase().replace(/[^a-z]/g, '_');
                let initiative = {
                  _id,
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
    let _error;

    // Create new initiative to show demand (if not exists)
    Initiative.findOne(
      { _id: 'demand' },
      (error, demand) => {
        if (!demand) {
          _error = error;
          new Initiative({
            _id: 'demand',
            name: 'Demand',
            account: 'Griddynamics',
            color: '#FF5050'
          }).save();
        }
      }
    );

    return new Promise(async (resolve, reject) => {
      // Keep demand to requisition relationships
      let rd = await RequisitionDemand.find({}).exec();
      rd = rd.reduce((result, req) => {
        result[req.requisitionId] = req;
        return result;
      }, {});
      let newRd = {};
      let now = new Date();

      let data = await this.PMO.getDemandDicts().catch(error => _error = error);
      if (_error) {
        return reject(_error);
      }

      let { load, locations, accounts, grades, workProfiles, stages, types, statuses } = data;
      let destinations = data['deploy-destinations'];

      const specializations = Object.keys(workProfiles).reduce((result, key: string) => {
        let profile = workProfiles[key];
        profile.specializations.forEach(spec => result[spec.id] = spec);
        return result;
      }, {});

      const transformLocations = (item) => {
        return item.locations.map(lId => {
          const name = locations[lId].name;
          return locationsMap[name] || name;
        }).sort().join(', ');
      };

      const transformDestinations = (item) => {
        let d = item.deployDestinations;
        if (d && d.length === 1 && d[0] === 1) {
          return 'Offshore';
        }
        let prefix = 'On-site ' + (item.availabilityForShortTrips ? 'short' : 'long');
        return prefix + ' (' + item.deployDestinations.map(dId => (destinations[dId] || {}).name || dId).sort().join(', ') + ')';
      };

      Object.keys(load).forEach(id => {
        let item = load[id];
        let demand, status;
        const requestId = (item.jobviteId || '')
          .split(',')
          .map((id: string) => 
             (id || '').toUpperCase().replace(reqId, '$1')
          );

        try {
          status = statuses[item.statusId].name;

          const account = item.account.name;
          const end = new Date(item.startDate);
          end.setDate(end.getDate() + item.duration * 7);

          const profile = workProfiles[item.workProfileId].name;
          const specs = item.specializations.map(sid => specializations[sid].name).join(', ');
          const pool = demandPoolsMap[profile + '-' + specs] || '';

          demand = {
            login: (id + ':' + specs + '_' + profile + '_for_' + account).replace(/[ .:]/g, '_'),
            name: id + ' ' + specs + ' ' + profile,
            account: account,
            comment: item.comment,
            candidates: item.proposedCandidates.map(candidate => candidate.name),
            deployment: transformDestinations(item),
            end: end.toISOString().substr(0, 10),
            grades: item.gradeRequirements.map(rid => {
              let grade = grades[rid];
              return grade ? (grade.code + grade.level) : '?';
            }).sort().join(', '),
            locations: transformLocations(item),
            profile,
            project: item.project.name,
            role: types[item.typeId].billableStatus,
            start: item.startDate,
            specializations: specs,
            stage: stages[item.stageId].code,
            requestId,
            requirements: item.requirements,

            pool
          };
        } catch (e) {
          return reject(e);
        }

        if (requestId && requestId.length) {
          requestId
            .filter(requisitionId => !!requisitionId)
            .forEach(requisitionId => {
              let r = rd[requisitionId];
              if (!r) {
                r = {
                  requisitionId,
                  demandIds: [],
                  updated: now
                };
              }
            if (!r.demandIds.includes(demand.login)) {
              r.demandIds.push(demand.login);
              newRd[requisitionId] = r;
            }
          });
        }

        if (status === 'Active') {
          setTimeout(() => new Demand(demand).save((err, data) => {
            if (err) reject(err);
          }), 0);
        }

      });

      Object.keys(newRd).forEach(r => new RequisitionDemand(newRd[r]).save());

      return resolve();
    });
  }

  private _queryConfluence(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        let whois: any[] = await this.wiki.getWhois().catch(reject);

        this._addLog(whois.length + ' records fetched', 'whois');

        resolve(whois.reduce((result, u) => {
          let [pool, name, account, initiative, profile, grade, manager, location, skype, phone, room, login] = u;
          result[login] = { manager, skype, phone, room };
          return result;
        }, {}));
      } catch (e) {
        reject(e);
      }
    });
  };

  private _convertLocations(locations: string = ''): string {
    return locations.split('/')
      .map((l: string) => {
        l = l.trim();
        return requisitionsLocations[l] || l
      })
      .sort()
      .join(', ');
  }

  private _queryRequisitions(): Promise<string[]> {
    let result = [];
    return new Promise(async (resolve, reject) => {
      let total = await this.jv.getRequisitionsCount();
      let result = [];
      let fetchers = new Array(Math.ceil(total / requisitionsChunk)).join('.').split('.').map((x, i) => {
        let from = 1 + i * requisitionsChunk;
        return new Promise((res, rej) =>
          // Using timeout to overcome calls per second API limitation
          setTimeout(
            () => this.jv.getRequisitions(from, requisitionsChunk)
              .then(([requisitions, ]) => {
                const diapasone = '[' + from + '÷' + (from + requisitionsChunk - 1) + ']';
                this._addLog('Requisitions chunk fetched ' + diapasone, 'jobvite');
                result = result.concat(requisitions);
                res();
              })
              .catch(error => rej(error)),
            10000 * i
          )
        );
      });

      Promise.all(fetchers)
        .then(() => {
          this._addLog(result.length + ' requisitions fetched', 'jobvite');
          let idsMet = [];
          resolve(
            result.map(requisition => {
              if (idsMet.includes(requisition.requisitionId)) {
                console.log('Error: duplicated requisition ' + requisition.requisitionId);
              } else {
                delete requisition.jobLocations;
                delete requisition.__v;
                requisition.location = this._convertLocations(requisition.location);

                new Requisition(requisition).save();
                idsMet.push(requisition.requisitionId);
              }
              return requisition.requisitionId;
            })
          )
        })
        .catch(reject);
    });
  }

  private async _jvGetCandidatesChunk(start: number, count: number, allowedRequisitions: string[], resolve, reject) {
    const diapasone = '[' + start + '÷' + (start + count - 1) + ']';
    let _error;
    let [data, ] = await this.jv.getCandidates(start, count).catch(error => _error = error);
    if (_error) {
      console.log('Unable to fetch JobVite candidates chunk ' + diapasone, _error);
      return reject(_error);
    };

    this._addLog('Candidates chunk fetched ' + diapasone, 'jobvite');
    let now = new Date().getTime();
    let saved = 0;
    data.forEach((candidate, index) => {
      let name = candidate.lastName + ' ' + candidate.firstName;
      let job = candidate.job || {};
      let application = candidate.application || {};
      let applicationJob = application.job || {};
      let state = candidateStates[application.workflowState];
      let requisitionId = applicationJob.requisitionId || '';
      let login = requisitionId + '-' + (candidate.firstName + '_' + candidate.lastName).toLowerCase().replace(/[\.\-]/g, '_');
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
        && allowedRequisitions.includes(nc.requisitionId)
        // && updated
        // && (now - updated.getTime()) < outdated
      ) {
        saved++;
        nc.save();
      }
    });
    console.log(saved + ' candidates saved');
    resolve();
  }

  private _queryCandidates(requisitionIds: string[]): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let _error;
      let total = await this.jv.getCandidatesCount().catch(error => _error = error);
      if (_error) {
        this._addLog('Error fetching candidates count', _error);
        return reject(_error);
      };

      this._addLog(total + ' candidates found', 'jobvite');

      let fetchers = new Array(Math.ceil(total / candidatesChunk)).join('.').split('.').map((x, i) => {
        let from = 1 + candidatesChunk * i;
        return new Promise((res, rej) =>
          // Using timeout to overcome calls per second API limitation
          setTimeout(
            () => this._jvGetCandidatesChunk(from, candidatesChunk, requisitionIds, res, rej),
            10000 * i
          )
        );
      });

      Promise.all(fetchers)
        .then(resolve)
        .catch(reject);
    });
  }
}
