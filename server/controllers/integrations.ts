const request = require('request');
var parser = require('xml2json');
var GoogleSpreadsheet = require('google-spreadsheet');

const env = process.env;
const pmo = 'https://pmo.griddynamics.net/';
const bamboo = 'api.bamboohr.com/api/gateway.php/griddynamics/v1/';

import { creds } from '../google.credentials';

// var doc = new GoogleSpreadsheet('1HOs5FxjZ180jUh8VcI2ch_J8jqyJRce4J_PTUv9MzLA');
var doc = new GoogleSpreadsheet('1BQqU4ii3xv7jRhUPHuX61LFAqt9RH79b67B8IuC1uFY');
var sheet;

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
          res.send(body);
        });
    });
  }

  pmoGetPeople = (req, res) => {
    this._login().on('response', () => {
      request.get(
        this._fillRequest(pmo + 'service/people'),
        (error, response, body) => {
          res.setHeader('Content-Type', 'application/json');
          res.send(body);
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
        console.log(body);
        res.send(body);
      });
  };

  _googleAuth(callback: Function) {
    doc.useServiceAccountAuth(creds, callback);
  }

  _filterRow(row: any) {

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
              if (row[0]) result.push(row);
              row = [];
            }
            row.push(cell.value);
          });
          if (row[0]) result.push(row);

          res.setHeader('Content-Type', 'application/json');
          res.send(result);
        });
      });
    });
  }
}
