import { postJson, sendJson, ssoQuery } from './utils';

const request = require('request');
const env = process.env;
const inGrid = 'https://in.griddynamics.net/api/';

export default class InGridCtrl {
  ssoHeader = null;

  private _query = (url: string, preprocessor=null): Promise<any> => {
    return ssoQuery(inGrid + url)
      .then(data => preprocessor ? preprocessor(data) : data)
      .catch(error => {
        console.log('Error requesting skill tree skills', error);
        return error;
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