const request = require('request');
var parser = require('xml2json');
var GoogleSpreadsheet = require('google-spreadsheet');

const env = process.env;
const pmo = 'https://pmo.griddynamics.net/';
const bamboo = 'api.bamboohr.com/api/gateway.php/griddynamics/v1/';

import { creds } from '../google.credentials';
import { htmlParse } from './htmlparser';

var doc = new GoogleSpreadsheet(env.DEMAND_SHEET);
var sheet;

var Confluence = require('confluence-api');
var confluenceConfig = {
  username: env.PMO_LOGIN,
  password: env.PMO_PASSWORD,
  baseUrl: 'https://wiki.griddynamics.net'
};
var confluence = new Confluence(confluenceConfig);

export default class IntegrationsCtrl {

  cookie = '';

  _fillRequest(url: string, payload={}) {
    let jar = request.jar();
    jar.setCookie(this.cookie, url);
    return Object.assign({}, {url, jar, form: payload});
  }

  _login() {
    this.cookie = '';
    return request.post({
      url: pmo + 'j_spring_security_check',
      form: {j_username: env.PMO_LOGIN, j_password: env.PMO_PASSWORD}
    })
      .on('response', response => {
        this.cookie = request.cookie(response.headers['set-cookie'][0]);
      });
  }

  pmoLogin = (req, res) => {
    this._login().then(() => res.setStatus(200));
  }

  pmoGetAccounts = (req, res) => {
    this._login().on('response', () => {
      request.get(
        this._fillRequest(pmo + 'service/account/getAccounts.action'),
        (error, response, body) => {
          res.setHeader('Content-Type', 'application/json');
          res.json(body);
        });
    });
  }

  pmoGetPeople = (req, res) => {
    this._login().on('response', () => {
      request.get(
        this._fillRequest(pmo + 'service/people'),
        (error, response, body) => {
          res.setHeader('Content-Type', 'application/json');
          res.json(JSON.parse(body));
        });
    });
  }

  _makeBambooRequest(endpoint: string, payload={}) {
    return {
      url: 'https://' + env.BAMBOO_KEY + ':x@' + bamboo + endpoint
    };
  }

  bambooTimeoff = (req, res) => {
    let data = [];
    return request.get(this._makeBambooRequest('time_off/requests/'))
      .on('data', chunk => {
        data.push(chunk);
      })
      .on('end', () => {
        let body = parser.toJson(Buffer.concat(data).toString());
        res.setHeader('Content-Type', 'application/json');
        // console.log(body);
        res.json(JSON.parse(body));
      });
  };

  _googleAuth(callback: Function) {
    doc.useServiceAccountAuth(creds, callback);
  }

  googleGetInfo = (req, res) => {
    this._googleAuth(() => {
      doc.getInfo(function(err, info) {
        if (err) return res.setStatus(500);

        let result = [];

        let sheet = info.worksheets[1];

        sheet.getCells({
          'min-row': 8,
          'return-empty': true
        }, (err, cells) => {
          if (err) return res.setStatus(500);

          let row = [];
          cells.forEach(cell => {
            if (cell.col == 1 && cell.row) {
              if (row[1]) result.push(row);
              row = [cell.row];
            }
            row.push(cell.value);
          });
          if (row[0]) result.push(row);

          res.setHeader('Content-Type', 'application/json');
          res.json(result);
        });
      });
    });
  }

  confluenceGetWhois = (req, res) => {
    confluence.getContentByPageTitle('HQ', 'New WhoIs', function(err, data) {
      if (err) return res.setStatus(500);

      let [, , body, ,] = data.results[0].body.storage.value.split(/(var dataSet = |;\s+var newData =)/g);

      res.setHeader('Content-Type', 'application/json');
      res.json(JSON.parse(body.replace(/\t/g, ' ')));
    });
  }

  confluenceGetVisas = (req, res) => {
    confluence.getCustomContentById({
      id: '1802301',
      expanders: ['body.view']
    }, function(err, data) {
      if (err) return res.setStatus(500);

      res.setHeader('Content-Type', 'application/json');
      res.json(htmlParse(data.body.view.value));
    });
  }

}
