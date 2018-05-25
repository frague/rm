const request = require('request');
const Confluence = require('confluence-api');
import { htmlParse } from '../htmlparser';

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
          reject(error);
        }

        let [, , body, ,] = data.results[0].body.storage.value.split(/(var dataSet = |;\s+var newData =)/g);

        let whois = JSON.parse(body.replace(/\t/g, ' '));
        resolve(whois);
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
          reject(error);
        }

        let visas = htmlParse(data.body.view.value);
        resolve(visas);
      });
    });
  }

}