const request = require('request');
var parser = require('xml2json');
var GoogleSpreadsheet = require('google-spreadsheet');

const env = process.env;
const pmo = 'https://pmo.griddynamics.net/';
const skillTree = 'https://skilltree.griddynamics.net/api/';
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

  pmoCookie = '';
  skillTreeCookie = '';

  _fillRequest(cookie: string, url: string, payload={}) {
    let jar = request.jar();
    jar.setCookie(cookie, url);
    return Object.assign({}, {url, jar, form: payload});
  }

  _login(url: string) {
    return request.post({
      url,
      form: {j_username: env.PMO_LOGIN, j_password: env.PMO_PASSWORD}
    });
  }

  _pmoLogin = () => {
    this.pmoCookie = '';
    return this._login(pmo + 'j_spring_security_check')
      .on('response', response => {
        this.pmoCookie = request.cookie(response.headers['set-cookie'][0]);
      });
  }

  pmoGetAccounts = (req, res) => {
    this._pmoLogin()
      .on('response', () => {
        request.get(
          this._fillRequest(this.pmoCookie, pmo + 'service/account/getAccounts.action'),
          (error, response, body) => {
            res.setHeader('Content-Type', 'application/json');
            res.json(body);
          });
      });
  }

  pmoGetPeople = (req, res) => {
    this._pmoLogin()
      .on('response', () => {
        request.get(
          this._fillRequest(this.pmoCookie, pmo + 'service/people'),
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

  getSheetPortion = (sheet, min, max) => {
    return new Promise((resolve, reject) => {
      sheet.getCells({
          'min-row': min,
          'max-row': max,
          'return-empty': true
        }, (err, cells) => {
          if (err) reject(err);
          let result = [];
          let row = [];
          cells.forEach(cell => {
            if (cell.col == 1 && cell.row) {
              if (row[1]) result.push(row);
              row = [cell.row];
            }
            row.push(cell.value);
          });
          if (row[0]) result.push(row);
          resolve(result);
        });
      }
    )
    .catch(err => console.log(err));
  }

  googleGetInfo = (req, res) => {
    this._googleAuth(() => {
      doc.getInfo(async (err, info) => {
        if (err) return res.sendStatus(500);

        let result = [];

        let sheet = info.worksheets[1];
        let rowsCount = sheet.rowCount;
        let row = 8; // Min row
        let offset = 500; // Rows fits into memory at once

        while (row < rowsCount) {
          let maxRow = (row + offset > rowsCount) ? rowsCount : row + offset;
          console.log('Reading demand sheet lines range', row, '-', maxRow);
          result =  result.concat(await this.getSheetPortion(sheet, row, maxRow));
          row = maxRow + 1;
        }
        res.setHeader('Content-Type', 'application/json');
        res.json(result);
      });
    });
  }

  confluenceGetWhois = (req, res) => {
    confluence.getContentByPageTitle('HQ', 'New WhoIs', function(err, data) {
      if (err) return res.sendStatus(500);

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
      if (err) return res.sendStatus(500);

      res.setHeader('Content-Type', 'application/json');
      res.json(htmlParse(data.body.view.value));
    });
  }


  _skillTreeLogin = () => {
    this.skillTreeCookie = '';
    return this._login(skillTree + 'auth')
      .on('response', response => {
        this.skillTreeCookie = request.cookie(response.headers['set-cookie'][0]);
      });
  }

  skillTreeGetSkills = (req, res) => {
    const userId = req.params.userId;
    this._skillTreeLogin()
      .on('response', () => {
        request.get(
          this._fillRequest(this.skillTreeCookie, skillTree + 'v2/user/' + userId + '/allSkills'),
          (error, response, body) => {
            res.setHeader('Content-Type', 'application/json');
            res.json(JSON.parse(body));
          });
      });
  }

  skillTreeGetInfo = (req, res) => {
    const userId = req.params.userId;
    this._skillTreeLogin()
      .on('response', () => {
        request.get(
          this._fillRequest(this.skillTreeCookie, skillTree + 'v2/user/' + userId + '/info'),
          (error, response, body) => {
            res.setHeader('Content-Type', 'application/json');
            res.json(JSON.parse(body));
          });
      });
  }

}
