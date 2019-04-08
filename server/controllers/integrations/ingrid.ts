import { postJson, sendJson, ssoLogin } from './utils';

const request = require('request');
const env = process.env;
const inGrid = 'https://in.griddynamics.net/api/';

export default class InGridCtrl {
  ssoHeader = null;

  private _query = (url: string, preprocessor=null): Promise<any> => {
    return new Promise(async (resolve, reject) => {
      if (!this.ssoHeader) {
        let _error;
        this.ssoHeader = await ssoLogin().catch(error => _error = error);
        if (_error) {
          return reject(_error);
        }
      }

      request.get(
        inGrid + url,
        this.ssoHeader,
        (err, response, body) => {
          console.log('inGrid response', response);
          let data;
          try {
            if (err) throw err;
            data = JSON.parse(body);
          } catch (error) {
            console.log('Error decoding json', body);
            return reject(error);
          }
          if (preprocessor) {
            data = preprocessor(data);
          }
          resolve(data);
        })
          .on('error', error => {
            console.log('Error requesting inGrid', error);
            reject(error);
          });
    });
  }

  // Get user feedbacks
  queryFeedbacksFor = (req, res): void => {
    const userId = req.params.userId;
    new Promise((resolve, reject) => {
      this._query(`feedback?username=${userId}`, resolve).catch(reject);
    })
      .then(data => sendJson(data, res))
      .catch(() => res.sendStatus(500));
  }

  // Get user org chart
  queryOrgchartFor = (req, res): void => {
    const userId = req.params.userId;
    new Promise((resolve, reject) => {
      this._query(`user/${userId}/orgChart`, resolve).catch(reject);
    })
      .then(data => sendJson(data, res))
      .catch(() => res.sendStatus(500));
  }
}