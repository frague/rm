import BaseCtrl from './base';
import Assignment from '../models/assignment';
import Resource from '../models/resource';
import SkillTreeCtrl from './integrations/skilltree';
import { fakeRes } from './fakeresponse';

const andKey = '$and';
const inKey = '$in';
const regexKey = '$regex';

const skillTree = new SkillTreeCtrl();
const skillsExpr = new RegExp(/^skills/);
const skillExprExpr = new RegExp(/^\/([^\/]*)\/i$/);
const delimiter = skillTree.delimiter;

const defaultColumns = [
  'assignments',
  'assignmentsSet',
  'login',
  'name',
  'grade',
  'minDate',
  'maxDate',
  'billable',
  'canTravel',
  'status',
  'commentsCount',
  'comments'
];
const columnName = new RegExp(/^[a-z0-9.]+$/, 'i');

// const billableStatuses = ['Billable', 'Booked', 'PTO Coverage', 'Funded'];
const billableStatuses = ['Billable', 'PTO Coverage'];

export default class AssignmentCtrl extends BaseCtrl {
  model = Assignment;

  modifiers = {
    exclude: ['demand', 'skills', 'candidate', 'requisition'],
    comments: this.commentTransform
  };

  order;
  shift;

  filterSkills = (source: any[]): any[] => {
    let result = [];
    source.forEach(item => {
      item = item || {};
      let key = Object.keys(item)[0];
      let value = item[key];
      if (key === andKey) {
        result = result.concat(this.filterSkills(item[key]))
      } else if (skillsExpr.test(key)) {
        if (typeof value === 'string') {
          let expr = value.replace(skillExprExpr, '$1');
          if (expr !== value) {
            value = '[^' + delimiter + ']*' + expr + '[^' + delimiter + ']*';
          }
          result.push(value.toLowerCase());
        } else {
          Object.keys(value).forEach(conditionKey => {
            let conditionValue = value[conditionKey];
            switch (conditionKey) {
              case inKey:
                result = result.concat(conditionValue);
                break;
            }
          });
        }
      }
    });
    return result;
  };

  getAll = async (req, res) => {
    let or;
    let columns = [], group = [];
    try {
      or = req.query.or ? JSON.parse(req.query.or) : [];
      columns = this.determineColumns(req);
    } catch (e) {
      console.error('Error parsing search query: ' + req.query.or);
      return res.sendStatus(500);
    }
    this.order = this.determineOrder(req);
    this.shift = +JSON.parse(req.query.shift || '0');

    let skillsList = this.filterSkills(or) || [];

    console.log('- Assignments -----------------------------------------------------');
    console.log('Extra columns:', columns);
    console.log('Initial:', JSON.stringify(or));
    console.log('Order:', JSON.stringify(this.order));
    console.log('Skills:', JSON.stringify(skillsList));

    let skillsByUser = {};
    if (skillsList.length) {
      try {
        let skillIds = await skillTree.getAllSkills();
        let { ids, suggestions } = skillTree.mapSkillsIds(skillsList);
        console.log('Skills suggestions are fetched:', suggestions, ids);

        if (!ids || !ids.length) {
          return res.json({message: 'No skills found', data: []})
        }

        let people = await skillTree.getEngineersBySkills(ids)
          .catch(error => {
            res.json({message: 'No skills found', data: []})
            throw error;
          });

        let skillsRequested = suggestions.join(', ');
        if (people && people.length) {
          let and = or[0][andKey];
          if (!and) {
            and = [];
            or[0][andKey] = and;
          }
          and.push({
            login: {
              '$in': people.map(person => {
                skillsByUser[person.user_id] = person.skills;
                return person.user_id;
              })
            }
          });
          console.log('With skills:', JSON.stringify(or));
        } else {
          let message = `No people with the following skills found: ${skillsRequested}`;
          return res.json({message, data: []})
        }
        let query = this.modifyCriteria(or, this.modifiers, group);
        this._query(res, this.fixOr(query), columns, group, skillsRequested, skillsByUser);
      } catch (e) {
        console.log('Error', e);
        return res.sendStatus(500);
      }
    } else {
      let query = this.modifyCriteria(or, this.modifiers, group);
      this._query(res, this.fixOr(query), columns, group);
    }
  }

  _query = (res, query, columns=[], group=[], skillsRequested='', skillsByUser={}) => {
    console.log('Query:', JSON.stringify(query));
    console.log('Columns1:', group);
    console.log('Group1:', group);

    let now = new Date();
    now.setDate(this.shift + now.getDate());

    // Extended columns information
    group = group.reduce((result, column) => {
      [column, ] = column.split('.', 2);
      this._addGroup(result, column);
      return result;
    }, {});

    let project = {};
    columns.forEach(column => {
      if (!defaultColumns.includes(column) && columnName.test(column)) {
        [column, ] = column.split('.', 2);
        this._addGroup(group, column);
        project[column] = 1;
      }
    });
    console.log('Group:', group);
    console.log('Project:', project);

    let cursor = Resource
      .aggregate([
        {
          '$lookup': {
            from: 'comments',
            localField: 'login',
            foreignField: 'login',
            as: 'comments'
          }
        },
        {
          '$addFields': {
            commentsCount: {'$size': '$comments'}
          }
        },
        {
          '$lookup': {
            from: 'assignments',
            localField: 'login',
            foreignField: 'resourceId',
            as: 'assignment'
          }
        },
        {
          '$unwind': {
            path: '$assignment',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          '$lookup': {
            from: 'initiatives',
            localField: 'assignment.initiativeId',
            foreignField: '_id',
            as: 'initiative'
          }
        },
        {
          '$unwind': {
            path: '$initiative',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          '$lookup': {
            from: 'demands',
            let: {
              login: '$login',
              name: '$name'
            },
            pipeline: [
              {
                '$match': {
                  '$expr': {
                    '$or': [
                      {'$in': ['$$login', '$candidates']},
                      {'$in': ['$$name', '$candidates']}
                    ]
                  }
                }
              }
            ],
            as: 'proposed'
          }
        },
        {
          '$addFields': {
            'onVacation': {
              '$cond': {
                if: {
                  '$and': [
                    {'$lte': ['$assignment.start', now]},
                    {'$gte': ['$assignment.end', now]},
                    {'$eq': ['$assignment.initiativeId', 'vacation']},
                  ]
                },
                then: '$assignment.end',
                else: ''
              }
            }
          }
        },
        {
          '$addFields': {
            'activeUsVisa': {
              '$reduce': {
                input: '$visas',
                initialValue: null,
                in: {
                  '$cond': {
                    if: {
                      '$and': [
                        {'$gt': ['$$this.isUs', 0]},
                        {'$gt': ['$$this.isUs', '$$value.isUs']},
                        {'$ne': ['$$this.till', null]},
                        {'$gt': ['$$this.till', now]},
                      ]
                    },
                    then: '$$this',
                    else: '$$value'
                  }
                }
              }
            }
          }
        },
        {
          '$addFields': {
            'assignment.account': '$initiative.account',
            'assignment.initiative': '$initiative.name',
            'assignment.billable': {
              '$cond': {
                if: {
                  '$and': [
                    {'$in': ['$assignment.billability', billableStatuses]},
                    {'$gt': ['$assignment.involvement', 0]}
                  ]
                },
                then: 'true',
                else: 'false'
              }
            },
            canTravel: {
              '$cond': {
                if: {
                  '$gt': ['$activeUsVisa.till', now]
                },
                then: 'true',
                else: 'false'
              }
            },
            status: {
              '$arrayElemAt': [
                {
                  '$filter': {
                    input: '$comments',
                    as: 'status',
                    cond: {
                      '$eq': ['$$status.isStatus', true]
                    }
                  }
                },
                0
              ]
            }
          }
        },
        {
          '$addFields': {
            'assignment.billableNow': {
              '$cond': {
                if: {
                  '$and': [
                    {'$eq': ['$assignment.billable', 'true']},
                    {'$lte': ['$assignment.start', now]},
                    {'$or': [
                        {'$gte': ['$assignment.end', now]},
                        {'$eq': ['$assignment.end', null]}
                      ]
                    },
                    {'$gt': ['$assignment.involvement', 0]}
                  ]
                },
                then: 'true',
                else: 'false'
              }
            }
          }
        },
        {
          '$unwind': {
            path: '$comments',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          '$addFields': {
            cm: {
              '$arrayToObject': [
                ['key', 'value'],
                ['key1', 'value1'],
              ]
            }
          }
        },
        {
          '$group': Object.assign(group, {
            _id: '$_id',
            assignments: { '$push': '$assignment' },
            assignmentsSet: { '$max': '$assignment._id' },
            name: { '$first': '$name' },
            grade: { '$first': '$grade' },
            minDate: {'$min': '$assignment.start'},
            maxDate: {'$max': '$assignment.end'},
            billable: {'$max': '$assignment.billableNow'},
            canTravel: { '$max': '$canTravel' },
            onVacation: { '$max': '$onVacation' },
            login: { '$first': '$login' },
            status: { '$first': '$status' },
            commentsCount: { '$first': '$commentsCount' },
            comments: {'$push': '$comments'},
            proposed: {'$first': '$proposed.login'},
            cm: {'$push': '$cm'},
          })
        },
        {
          '$addFields': {
            'assignments': {
              '$cond': {
                if: '$assignmentsSet',
                then: '$assignments',
                else: []
              }
            }
          }
        },
        {
          '$match': query
        },
        {
          '$sort': this.order
        },
        {
          '$project': Object.assign(project, {
            _id: 1,
            assignments: 1,
            assignmentsSet: 1,
            name: 1,
            grade: 1,
            starts: 1,
            ends: 1,
            minDate: 1,
            maxDate: 1,
            billable: 1,
            canTravel: 1,
            login: 1,
            status: 1,
            commentsCount: 1,
            proposed: 1,
            cm: 1
          })
        }
      ])
      .cursor({})
      .exec()
      .toArray()
      .then(data => {
        let message = skillsRequested ? `Skills matched: ${skillsRequested}` : '';
        if (data && skillsByUser) {
          data.forEach(user => {
            let userSkills = skillsByUser[user.login];
            user.skills = userSkills ? userSkills.reduce((p, skill) => {
              p[skill.name] = skill.level || skill.declared_level;
              return p;
            }, {}) : {};
          });
        }
        res.json({message, data});
      })
      .catch(error => {
        console.log('Error', error);
        return res.sendStatus(500);
      });
  }
}
