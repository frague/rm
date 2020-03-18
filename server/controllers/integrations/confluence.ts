const https = require('https');
const http = require('http');
const Url = require('url');
const { URLSearchParams } = require('url');

import { visasParse, accountsParse } from '../htmlparser';
import { login, fillRequest } from './utils';

const env = process.env;

const accountsUrl = RegExp(/\"url\":\"([^\"]+)\"/);
const iframeUrl = RegExp(/<iframe[^>]+src=\"([^\"]+)\"/);

class Confluence {
  auth = Buffer.from(`${env.CONFLUENCE_LOGIN}:${env.CONFLUENCE_PASSWORD}`).toString('base64');
  headers = {
    'Authorization': `Basic ${this.auth}`,
    'Content-Type': 'application/json'
  };
  baseUrl = 'https://griddynamics.atlassian.net/wiki/rest/api/content/';

  request(url: string, options: any): Promise<string> {
    return new Promise((resolve, reject) => {
      let urlParsed = Url.parse(url);
      let protocol = urlParsed.protocol === 'https:' ? https : http;
      options = Object.assign(
        {
          headers: this.headers,
          hostname: urlParsed.hostname,
          path: urlParsed.path,
        },
        options
      );

      let data = '';
      let req = protocol.request(options, (res) => {
          if (!res || res.statusCode !== 200) {
            console.log(res.statusCode);
            return reject(`Error fetching data from ${url}`);
          }
          res.on('data', (chunk) => data = `${data}${chunk}`);
          res.on('end', () => resolve(data));
        }
      );
      req.on('error', (error) => reject(error));
      req.end();
    });
  }

  confluenceGet(uri, params): Promise<string> {
    let searchParams = new URLSearchParams(
      Object.assign({
        expand: ['body.view']
      }, params)
    );
    let url = this.baseUrl + uri + '?' + searchParams.toString();

    return this.request(url, {method: 'GET'});
  }

  getContentByPageTitle = (spaceKey: string, title: string): Promise<any> => this.confluenceGet('', {title, spaceKey});
  getCustomContentById = (pageId: string): Promise<any> => this.confluenceGet(`${pageId}`, {});
}

const confluence = new Confluence();

export default class ConfluenceIntegrationsCtrl {

  // Whois information
  getWhois = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      confluence.getCustomContentById('524725')
        .then((data) => {
          try {
            // let json = JSON.parse(data);
            // let [, , body, ,] = json.body.view.value.split(/(var dataSet = |;\s+var newData =)/g);
            // let whois = JSON.parse(body.replace(/\t/g, ' '));
            let whois = [];
            resolve(whois);
          } catch (e) {
            reject(e);
          }
        })
        .catch(reject);
    });
  }

  // Visas
  getVisas = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      confluence.getCustomContentById('524547')
        .then((data) => {
          try {
            let json = JSON.parse(data).body.view.value;
            let visas = visasParse(json);
            resolve(visas);
          } catch (e) {
            reject(e);
          }
        })
        .catch(reject);
    });
  }

  // Accounts management
  getAccountManagement = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      confluence.getCustomContentById('524617')
      .then((data) => {
        try {
          // Fetching the wiki page and searching for the widget source
          let level1 = JSON.parse(data).body.view.value;
          let [, url1] = accountsUrl.exec(level1);
          if (!url1) throw 'Unable to find the link to accounts iFrame';

          // Fetching the widget markup and searching for the iframe src
          confluence.request(url1, {method: 'GET'})
            .then((level2) => {
              let [, url2] = iframeUrl.exec(level2);
              console.log('Url2: ', url2);
              if (!url2) throw 'Unable to find the link to accounts data inside the iFrame';

              // Fetching the final data to parse
              confluence.request(url2, {method: 'GET'})
                .then((level3) => resolve(accountsParse(level3)))   // Thanks god, we don't have to go deeper...
                .catch(reject);
            })
            .catch(reject);
        } catch (e) {
          reject(e);
        }
      })
      .catch(reject);
    });
  }

}