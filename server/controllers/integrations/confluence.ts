const request = require('request');
const Confluence = require('confluence-api');
import { visasParse, accountsParse } from '../htmlparser';

import { login, fillRequest } from './utils';

const env = process.env;
const confluenceConfig = {
  username: env.CONFLUENCE_LOGIN,
  password: env.CONFLUENCE_PASSWORD,
  baseUrl: 'https://wiki.griddynamics.net'
};
const confluence = new Confluence(confluenceConfig);

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
      confluence.getCustomContentById({
        id: '136693048',
        expanders: ['body.view']
      }, function(error, data) {
        if (error) {
          return reject(error);
        }

        try {
          resolve(accountsParse(data.body.view.value));
        } catch (e) {
          reject(e);
        }
     });
    });
  }

}