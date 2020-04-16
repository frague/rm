import BaseCtrl from './base';
import Assignment from '../models/assignment';
import Resource from '../models/resource';
import SkillTreeCtrl from './integrations/skilltree';
import { fakeRes } from './fakeresponse';
import { printTitle } from '../utils';

const andKey = '$and';
const inKey = '$in';
const regexKey = '$regex';

const skillTree = new SkillTreeCtrl();
const skillsExpr = new RegExp(/^skills/);
const skillExprExpr = new RegExp(/^\/([^\/]*)\/i$/);
const delimiter = skillTree.delimiter;

const defaultColumns = {
  'assignments': 1,
  'assignmentsSet': 1,
  'login': 1,
  'name': 1,
  'grade': 1,
  'location': 1,
  'minDate': 1,
  'maxDate': 1,
  'isBillable': 1,
  'canTravel': 1,
  'status': 1,
  'commentsCount': 1,
};

const resourceColumns = [
  'name',
  'login',
  'grade',
  'location',
  'profile',
  'specialization',
  'pool',
  'manager',
  'nextPr',
  'payRate',
  'onTrip',
  'birthday',
  'english',
  'CV',
];

const columnName = new RegExp(/^[a-z0-9_ .]+$/, 'i');

// const billableStatuses = ['Billable', 'Booked', 'PTO Coverage', 'Funded'];
const billableStatuses = ['Billable', 'PTO Coverage'];
const bookedStatus = 'Booked';
const fundedStatus = 'Funded';
const paidVacation = 'paid vacation';
const vacations = [paidVacation, 'unpaid vacation'];

export default class AssignmentCtrl extends BaseCtrl {
  model = Assignment;

  baseModifiers = {
    include: resourceColumns,
  };

  finalModifiers = {
    exclude: ['demand', 'skills', 'candidate', 'candidates', 'requisition', 'requisitions', 'requisitionId']
  };

  order;
  shift;

  private _hasComments = false;

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

  private _emptyResult(res, message='') {
    return res.json({message, data: []})
  }

  getAll = async (req, res) => {
    printTitle('Assignments');

    let or;
    let columns = [];
    let group = [];
    let orString = req.query.or || '[]';
    this._hasComments = orString.includes('comments.');
    try {
      or = JSON.parse(orString);
      columns = this.determineColumns(req);
    } catch (e) {
      console.error(`Error parsing search query: ${orString}`);
      return res.sendStatus(500);
    }
    or = await this.updateOr(or);

    this.order = this.determineOrder(req);
    this.shift = +JSON.parse(req.query.shift || '0');

    let skillsList = this.filterSkills(or) || [];

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
          return this._emptyResult(res, 'No skills found');
        }

        let people = await skillTree.getEngineersBySkills(ids)
          .catch(error => {
            this._emptyResult(res, 'No skills found');
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
          return this._emptyResult(res, message);
        }
        await this._query(res, or, columns, skillsRequested, skillsByUser);
      } catch (e) {
        console.log('Error', e);
        return res.sendStatus(500);
      }
    } else {
      await this._query(res, or, columns);
    }
  }

  _query = (res, or, columns=[], skillsRequested='', skillsByUser={}) => {
    let group = [];

    let baseQuery = this.fixOr(this.modifyCriteria(or, this.baseModifiers));
    let finalQuery = this.fixOr(this.modifyCriteria(or, this.finalModifiers, group));

    if (!Object.keys(finalQuery).length) return this._emptyResult(res, 'Assignments query is empty');

    console.log('Base query:', JSON.stringify(baseQuery));
    console.log('Final query:', JSON.stringify(finalQuery));

    let now = new Date();
    now.setDate(this.shift + now.getDate());
    now.setHours(0, 0, 0, 0);  // Good morning!

    // Extended columns information
    group = group.reduce((result, column) => {
      [column, ] = column.split('.', 2);
      this._addGroup(result, column);
      return result;
    }, {});

    let project = {};
    columns.forEach(column => {
      if (!defaultColumns[column] && columnName.test(column)) {
        [column, ] = column.split('.', 2);
        this._addGroup(group, column);
        project[column] = 1;
      }
    });
    console.log('Group:', group);
    console.log('Project:', project);

    let cursor = Resource
      .aggregate()
      .match(baseQuery)

      .lookup({
        from: 'comments',
        localField: 'login',
        foreignField: 'login',
        as: 'comments'
      })
      .addFields({
        'commentsCount': {'$size': '$comments'},
        'status': {
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
      })
      .lookup({
        from: 'assignments',
        localField: 'login',
        foreignField: 'resourceId',
        as: 'assignment'
      })
      .unwind({
        path: '$assignment',
        preserveNullAndEmptyArrays: true
      })
      .lookup({
        from: 'initiatives',
        localField: 'assignment.initiativeId',
        foreignField: '_id',
        as: 'initiative'
      })
      .unwind({
        path: '$initiative',
        preserveNullAndEmptyArrays: true
      })
      .lookup({
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
      })
      .addFields({
        'assignment.isActive': {
          '$and': [
            {'$lte': ['$assignment.start', now]},
            {'$or': [
              {'$gte': ['$assignment.end', now]},
              {'$eq': ['$assignment.end', null]}
            ]}
          ]
        },
      })
      .addFields({
        'onVacation': {
          '$cond': {
            if: {
              '$and': [
                '$assignment.isActive',
                {'$in': ['$assignment.initiativeId', vacations]},
              ]
            },
            then: '$assignment.end',
            else: ''
          }
        },
        'assignment.isBillable': {
          '$toString': {
            '$and': [
              '$assignment.isActive',
              {'$in': ['$assignment.billability', billableStatuses]},
              {'$gt': ['$assignment.involvement', 0]}
            ]
          }
        },
        'assignment.isBooked': {
          '$toString': {
            '$and': [
              '$assignment.isActive',
              {'$eq': ['$assignment.billability', bookedStatus]},
            ]
          }
        },
        'assignment.isFunded': {
          '$toString': {
            '$and': [
              '$assignment.isActive',
              {'$eq': ['$assignment.billability', fundedStatus]},
              {'$ne': ['$assignment.initiativeId', paidVacation]},
              {'$gt': ['$assignment.involvement', 0]}
            ]
          }
        },
      })
      .addFields({
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
      })
      .addFields({
        'assignment.account': '$initiative.account',
        'assignment.initiative': '$initiative.name',
        'canTravel': {
          '$toString': {
            '$gt': ['$activeUsVisa.till', now]
          }
        },
      })
      .group(Object.assign(group, {
        _id: '$_id',
        assignments: { '$push': '$assignment' },
        assignmentsSet: { '$max': '$assignment._id' },
        name: { '$first': '$name' },
        grade: { '$first': '$grade' },
        minDate: {'$min': '$assignment.start'},
        maxDate: {'$max': '$assignment.end'},
        isBillable: {'$max': '$assignment.isBillable'},
        isBooked: {'$max': '$assignment.isBooked'},
        isFunded: {'$max': '$assignment.isFunded'},
        canTravel: { '$max': '$canTravel' },
        onVacation: { '$max': '$onVacation' },
        login: { '$first': '$login' },
        status: { '$first': '$status' },
        commentsCount: { '$first': '$commentsCount' },
        comments: {'$first': '$comments'},
        proposed: {'$first': '$proposed.login'},
      }))
      .addFields({
        'assignments': {
          '$cond': {
            if: '$assignmentsSet',
            then: '$assignments',
            else: []
          }
        }
      });

    if (!this._hasComments) {
      // If no comments are in query - no need to
      // convert them to object prior to matching
      cursor.match(finalQuery);
    }

    // Heavy conversion of comments to an object
    cursor
      .addFields({
        'comments': {
          '$arrayToObject': {
            '$map': {
              input: '$comments',
              as: 'comment',
              in: [
                {
                  '$cond': {
                    if: '$$comment.source',
                    then: '$$comment.source',
                    else: '0',
                  }
                },
                '$$comment.text'
              ]
            }
          }
        }
      });

    if (this._hasComments) {
      // Otherwise conversion should be made prior to matching
      cursor.match(finalQuery);
    }

    cursor
      .sort(this.order)
      .project(Object.assign(project, defaultColumns, {
        _id: 1,
        starts: 1,
        ends: 1,
        // isBooked: 1,
        // isFunded: 1,
        proposed: 1,
      }))
      .exec()
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
        console.log(`Assignment: ${data && data.length} records matched`);
        res.json({message, data});
      })
      .catch(error => {
        console.log('Error', error);
        return res.sendStatus(500);
      });
  }
}
