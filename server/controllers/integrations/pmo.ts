const request = require('request');
import { login, fillRequest } from './utils';

const env = process.env;
const pmo = 'https://pmo.griddynamics.net/';
const pmoEmployees = pmo + '/service/api/employee/active';
const pmoAssignments = pmo + '/service/v1/people/employees';
const pmoDemandMeta = pmo + '/service/api/internal/position/demand/';
const pmoUserAssignments = pmo + '/api/v1/people/history/employee?id=';

export default class PmoIntegrationsCtrl {
  sessionCookies = '';

  login = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      this.sessionCookies = '';
      return login(pmo + 'j_spring_security_check', env.PMO_LOGIN, env.PMO_PASSWORD)
        .on('response', response => {
          this.sessionCookies = request.cookie(response.headers['set-cookie'][0]);
          resolve();
        })
        .on('error', error => {
          console.log('Error logging into PMO:', error);
          reject(error);
        });
    });
  }

  // Get employees info
  getPeople = (): Promise<any> => {
    return new Promise(async (resolve, reject) => {
      await this.login().catch(reject);
      request.get(
        fillRequest(this.sessionCookies, pmoAssignments),
        (error, response, body) => {
          let data;
          try {
            data = JSON.parse(body);
          } catch (e) {
            return reject(e);
          }
          resolve(data.data);
        })
        .on('error', error => {
          console.log('Error fetching employee from PMO');
          reject(error);
        });
    });
  }

  // Get employees info
  getUserAssignments = (bambooId: string): Promise<any> => {
    return new Promise(async (resolve, reject) => {
      await this.login().catch(reject);
      request.get(
        fillRequest(this.sessionCookies, pmoUserAssignments + bambooId),
        (error, response, body) => {
          let data;
          try {
            data = JSON.parse(body);
            resolve(data.data.assignments);
          } catch (e) {
            return reject(e);
          }
        })
        .on('error', error => {
          console.log('Error fetching employee assignments from PMO');
          reject(error);
        });
    });
  }

  // Fetching a single dictionary
  getDemandDict(name: string, index: number): Promise<any> {
    return new Promise((resolve, reject) => {
      let url = pmoDemandMeta + (index ? 'meta/' + name + '/active' : name);
      return request.get(
        fillRequest(this.sessionCookies, url),
        (error, response, body) => {
          try {
            body = JSON.parse(body).data.reduce((result, item) => {
              result[item.id] = item;
              return result;
            }, {});
            resolve(body);
          } catch (e) {
            console.log(e);
            reject('Error parsing PMO response for dict ' + name);
          }
        })
        .on('error', error => {
          console.log('Error', name, error);
          reject('Unable to access PMO demand dictionary ' + name);
        })
    });
  }

  getDemandDicts = async (): Promise<any> => {
    let _dicts = {};
    let _error;
    await this.login().catch(error => _error = error);
    if (_error) {
      return Promise.reject(_error);
    }
    return Promise.all([
        'load',
        'locations',
        'accounts',
        'grades',
        'workProfiles',
        'stages',
        'types',
        'statuses',
        'deploy-destinations'
      ].map((dict, index) => this.getDemandDict(dict, index).then(data => _dicts[dict] = data))
    )
      .then(() => _dicts);
  }

  getAssignments = (req, res) => {
    let { pmoId } = req.params;
    if (pmoId != +pmoId) {
      return res.sendStatus(500);
    }

	this.getUserAssignments(pmoId)
      .then(data => {
        res.setHeader('Content-Type', 'application/json');
        res.json(data);
      })
      .catch(err => res.sendStatus(500));
  }

}