const request = require('request');
var parser = require('xml2json');
var GoogleSpreadsheet = require('google-spreadsheet');

const env = process.env;
const pmo = 'https://pmo.griddynamics.net/';
const skillTree = 'https://skilltree.griddynamics.net/api/';
const bamboo = 'api.bamboohr.com/api/gateway.php/griddynamics/v1/';
const jobvite = 'https://api.jobvite.com/api/v2/';
// const jobvite = 'https://app-stg.jobvite.com/api/v2/';


import { creds } from '../google.credentials';
import { htmlParse } from './htmlparser';

// request.debug = true;

var doc = new GoogleSpreadsheet(env.DEMAND_SHEET);

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
  skills = null;
  skillsFlatten = '';
  delimiter = '%';

  _fillRequest(cookie: string, url: string, payload={}): any {
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

  // Google spreadsheets (Demand)

  _googleAuth(callback: Function) {
    doc.useServiceAccountAuth(creds, callback);
  }

  getSheetPortion = (sheet, min, max): Promise<any> => {
    return new Promise((resolve, reject) => {
      sheet.getCells({
          'min-row': min,
          'max-row': max,
          'return-empty': true
        }, (err, cells) => {
          if (err) {
            console.log(err);
            reject(err);
          }
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

  googleGetSheet = () => {
    return new Promise((resolve, reject) => {
      this._googleAuth(() => {
        doc.getInfo(async (err, info) => {
          if (err) return reject(err);
          resolve(info.worksheets[1]);
        });
      });
    })
    .catch(err => console.log(err));
  }

  // Confluence

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

  // Skill Tree methods

  _skillTreeLogin = () => {
    this.skillTreeCookie = '';
    return this._login(skillTree + 'auth')
      .on('response', response => {
        this.skillTreeCookie = request.cookie(response.headers['set-cookie'][0]);
      });
  }

  _getSkillTree(url: string, res, preprocessor=null) {
    return this._skillTreeLogin()
      .on('response', () => {
        request.get(
          this._fillRequest(this.skillTreeCookie, skillTree + url),
          (err, response, body) => {
            if (err) return res.sendStatus(500);

            let data = JSON.parse(body);
            if (preprocessor) {
              data = preprocessor(data);
            }

            res.setHeader('Content-Type', 'application/json');
            res.json(data);
          });
      });
  }

  skillTreeGetSkills = (req, res) => {
    const userId = req.params.userId;
    return userId === 'all' ? this.skillTreeGetAllSkills(res) : this.skillTreeGetUserSkills(userId, res);
  }

  _collectIds(source: any[], destination: any) {
    // source.forEach(item => destination[item.name.toLowerCase()] = item.id);
    source.forEach(item => destination[item.name] = item.id);
  }

  _flattenerFilter(source: any, result={}): Object {
    if (!source) {
      return result;
    }

    if (source.categories) {
      source.categories.forEach(category => result = Object.assign(result, this._flattenerFilter(category, result)));
    }
    if (source.skills) {
      source.skills.forEach(skill => {
        // result[skill.name.toLowerCase()] = skill.id;
        result[skill.name] = skill.id;
        if (skill.techs) this._collectIds(skill.techs, result);
      });
    }
    if (source.techs) this._collectIds(source.techs, result);
    return result;
  }

  mapSkillsIds(needles: string[]): {ids: any[], suggestions: any[]} {
    let criteria = new RegExp(this.delimiter + '(' + needles.join('|') + ')' + this.delimiter, 'gi');

    let ids = [];
    let suggestions = [];
    this.skillsFlatten.replace(criteria, (match, p1) => {
      ids.push({id: '' + this.skills[p1]});
      suggestions.push(p1);
      return match;
    });
    return {ids, suggestions};
  }

  skillTreeGetAllSkills = (res) => {
    if (this.skills) {
      res.setHeader('Content-Type', 'application/json');
      res.json(this.skills);
    } else {
      this._getSkillTree('v2/skill/all', res, data => {
        this.skills = this._flattenerFilter(data);
        this.skillsFlatten = this.delimiter + Object.keys(this.skills).join(this.delimiter + this.delimiter);
      });
    }
  }

  skillTreeGetUserSkills = (userId, res) => {
    this._getSkillTree('v2/user/' + userId + '/allSkills', res);
  }

  skillTreeGetInfo = (req, res) => {
    const userId = req.params.userId;
    this._getSkillTree('v2/user/' + userId + '/info', res);
  }

  skillTreeGetBySkills(skills: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this._skillTreeLogin()
        .on('response', () => {
          let query = {
            employees: [],
            skills
          };
          let options = this._fillRequest(
            this.skillTreeCookie,
            skillTree + 'v2/searchEmployee'
          );
          options.body = query;
          options.json = true;
          delete options.form;

          request.post(options, (err, response, body) => {
            if (err) return reject(err);
            resolve(body);
          });
        });
    });
  }

  // JobVite methods

  jvGetRequisitions = (req, res) => {
    var api = env.JV_JOBS_KEY;
    var sc = env.JV_JOBS_SECRET;
    if (!api || !sc) {
      throw "No JV keys provided to access the jobs API";
    }

    request.get(
      jobvite + 'job',
      {
        qs: {
          api,
          sc,
          jobStatus: ['Open', 'Approved', 'Draft', 'Awaiting Approval']
        },
        useQuerystring: true
      },
      (err, response, body) => {
        if (err) {
          console.log('Reqisitions fetching error', err);
          return res.sendStatus(500);
        }
        try {
          body = JSON.parse(body);
          res.setHeader('Content-Type', 'application/json');
          console.log('Total requisitions fetched:', body.total);
          res.json(body.requisitions);
        } catch (e) {
          console.log('Requisitions parsing error', e);
          res.sendStatus(500)
        }
      });

  }

  _jvGetCandidatesKeys() {
    var api = env.JV_CANDIDATES_KEY;
    var sc = env.JV_CANDIDATES_SECRET;
    if (!api || !sc) {
      throw "No JV keys provided to access the candidates API";
    }
    return {api, sc};
  }

  jvGetCandidates(start, count): Promise<any> {
    let keys = this._jvGetCandidatesKeys();
    return new Promise((resolve, reject) => {
      request.get(
        jobvite + 'candidate',
        {
          qs: Object.assign({start, count}, keys),
          useQuerystring: true
        },
        (err, response, body) => {
          if (err) {
            console.log('Candidates fetching error', err);
            reject(err);
          }
          try {
            body = JSON.parse(body);
            if (body.status.code !== 200) return reject(body.status.messages);
            resolve(body.candidates);
          } catch (e) {
            console.log('Candidates parsing error', e);
            reject(e)
          }
        });
    });
  }

  jvGetCandidatesCount(): Promise<number> {
    let keys = this._jvGetCandidatesKeys();
    return new Promise((resolve, reject) => {
      request.get(
        jobvite + 'candidate',
        {qs: Object.assign({count: 1}, keys)},
        (err, response, body) => {
          if (err) reject('Unable to access JV candidates API');
          try {
            body = JSON.parse(body);
            let total = body.total;
            console.log('JV candidates count: ' + total);
            resolve(total);
          } catch (e) {
            reject('Error parsing JV response')
          }
        }
      );
    });
  }

}
