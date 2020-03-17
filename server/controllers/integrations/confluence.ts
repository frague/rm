const request = require('request');
const https = require('https');

const { URLSearchParams } = require('url');
// const Confluence = require('confluence-api');
import { visasParse, accountsParse } from '../htmlparser';

import { login, fillRequest } from './utils';

const env = process.env;

class Confluence {
  auth = Buffer.from(`${env.CONFLUENCE_LOGIN}:${env.CONFLUENCE_PASSWORD}`).toString('base64');
  headers = {
    'Authorization': `Basic ${this.auth}`,
    'Content-Type': 'application/json'
  };
  baseUrl = 'https://griddynamics.atlassian.net/wiki/rest/api/content/';

  _get(uri, params, callback) {
    let searchParams = new URLSearchParams(
      Object.assign({
        expand: ['body.view']
      }, params)
    );
    let url = this.baseUrl + uri + '?' + searchParams.toString();
    let data = '';

    let req = https.request(
      {
        hostname: 'griddynamics.atlassian.net',
        path: '/wiki/rest/api/content/' + uri + '?' + searchParams.toString(),
        headers: this.headers,
        method: 'GET'
      },
      (res) => {
        if (!res || res.statusCode !== 200) {
          return callback('Error fetching data', null);
        }
        res.on('data', (chunk) => {
          data = `${data}${chunk}`;
        });

        res.on('end', () => {
          let result;
          try {
            result = JSON.parse(data);
          } catch {
            return callback('Error parsing confluence response', '');
          }
          console.log(result.body, Object.keys(result.body));
          callback(null, result.body.view.value);
        });
      }
    );

    req.on('error', (error) => callback(error, null));
    req.end();
  }

  getContentByPageTitle = (spaceKey, title, callback) => {
    this._get('', {title, spaceKey}, callback);
  };

  getCustomContentById = (pageId, callback) => {
    this._get(`${pageId}`, {}, callback);
  };
}

const confluence = new Confluence();

export default class ConfluenceIntegrationsCtrl {

  // Whois information
  getWhois = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      confluence.getContentByPageTitle('HQ', 'New WhoIs', function(error, data) {
        if (error) {
          return reject(error);
        }

        try {
          let [, , body, ,] = data.results[0].body.storage.value.split(/(var dataSet = |;\s+var newData =)/g);
          let whois = JSON.parse(body.replace(/\t/g, ' '));
          resolve(whois);
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  // Visas
  getVisas = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      confluence.getCustomContentById({
        id: '1802301',
        expanders: ['body.view']
      }, function(error, data) {
        if (error) {
          return reject(error);
        }
        try {
          let visas = visasParse(data.body.view.value);
          resolve(visas);
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  // Accounts management
  getAccountManagement = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      confluence.getCustomContentById('524617', function(error, data) {
        if (error) {
          return reject(error);
        }

        try {
          console.log(data);
          resolve(accountsParse(data));
          // resolve(accountsParse(data.body.view.value));
        } catch (e) {
          reject(e);
        }
     });
    });
  }

}