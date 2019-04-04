import { postJson, sendJson, ssoLogin } from './utils';

const request = require('request');
const env = process.env;
const skillTree = 'https://skilltree.griddynamics.net/api/';

export default class SkillTreeCtrl {
  skills = null;
  skillsFlatten = '';
  delimiter = '%';
  ssoHeader = null;

  private _query = (url: string, preprocessor=null): Promise<any> => {
    return new Promise(async (resolve, reject) => {
      if (!this.ssoHeader) {
        let _error;
        this.ssoHeader = await ssoLogin().catch(error => _error = error);
        if (_error) return reject(_error);
      }

      request.get(
        skillTree + url,
        this.ssoHeader,
        (err, response, body) => {
          console.log('SkillTree response');
          let data;
          try {
            data = JSON.parse(body);
          } catch (error) {
            console.log('Error decoding json');
            return reject(error);
          }
          if (preprocessor) {
            data = preprocessor(data);
          }
          resolve(data);
        })
          .on('error', error => {
            console.log('Error requesting skill tree skills', error);
            reject(error);
          });
    });
  }

  _collectIds(source: any[], destination: any) {
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
        result[skill.name] = skill.id;
        if (skill.techs) {
          this._collectIds(skill.techs, result);
        }
      });
    }
    if (source.techs) {
      this._collectIds(source.techs, result);
    }
    return result;
  }

  mapSkillsIds(needles: string[]): { ids: any[], suggestions: any[] } {
    let criteria = new RegExp(this.delimiter + '(' + needles.join('|') + ')' + this.delimiter, 'gi');

    let ids = [];
    let suggestions = [];
    this.skillsFlatten.replace(criteria, (match, p1) => {
      ids.push({id: '' + this.skills[p1]});
      suggestions.push(p1);
      return match;
    });
    return { ids, suggestions };
  }

  // Get all skills
  getAllSkills = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (this.skills) {
        resolve(this.skills);
      } else {
        this._query('v2/skill/all', data => {
          this.skills = this._flattenerFilter(data);
          this.skillsFlatten = this.delimiter + Object.keys(this.skills).join(this.delimiter + this.delimiter);
          return resolve(this.skills);
        })
          .catch(reject);
      }
    });
  }

  // Get all user's skills
  getUsersSkills = (userId): Promise<any> => {
    return this._query('v2/user/' + userId + '/allSkills');
  }

  // Get user's info
  getUsersInfo = (userId): Promise<any> => {
    return this._query('v2/user/' + userId + '/info');
  }

  // Find engineers who have skills listed
  getEngineersBySkills(skills: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      if (!this.ssoHeader) {
        let _error;
        this.ssoHeader = await ssoLogin().catch(error => _error = error);
        if (_error) return reject(_error);
      }

      let query = {
        employees: [],
        skills
      };
      let options: any = Object.assign(
        {
          url: skillTree + 'v2/searchEmployee',
        },
        this.ssoHeader
      );
      options.body = query;
      options.json = true;
      delete options.form;

      request.post(options, (err, response, body) => resolve(body)).on('error', reject);
    });
  }

  querySkills = (req, res): void => {
    const userId = req.params.userId;
    (userId === 'all' ? this.getAllSkills() : this.getUsersSkills(userId))
      .then(data => sendJson(data, res))
      .catch(() => res.sendStatus(500));
  }

  queryUsersInfo = (req, res): void => {
    const userId = req.params.userId;
    this.getUsersInfo(userId)
      .then(data => sendJson(data, res))
      .catch(() => res.sendStatus(500));
  }

  // queryLogin = (req, res): void => {
  //   this._login()
  //     .then(data => sendJson(data, res))
  //     .catch(() => res.sendStatus(500));
  // }
}