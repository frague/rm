import { postJson, sendJson, ssoQuery } from './utils';

const request = require('request');
const env = process.env;
const skillTree = 'https://skilltree.griddynamics.net/api/';

export default class SkillTreeCtrl {
  skills = null;
  skillsFlatten = '';
  delimiter = '%';
  ssoHeader = null;

  private _query = (url: string, preprocessor=null, options=null): Promise<any> => {
    return new Promise((resolve, reject) => {
      ssoQuery(skillTree + url, options)
        .then(data => resolve(preprocessor ? preprocessor(data) : data))
        .catch(error => {
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
    return this._query(skillTree + 'v2/searchEmployee', null, options);
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
}