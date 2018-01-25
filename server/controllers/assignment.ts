import BaseCtrl from './base';
import Assignment from '../models/assignment';
import Resource from '../models/resource';
import IntegrationsCtrl from './integrations';
import { fakeRes } from './fakeresponse';

const integrations = new IntegrationsCtrl();
const skillsExpr = new RegExp(/^skills/);
const delimiter = integrations.delimiter;

export default class AssignmentCtrl extends BaseCtrl {
  model = Assignment;

  cutDemand = (key: string) => {
    key = key || '';
    return key.indexOf('demand') && key.indexOf('comment');
  }

  filterSkills = (source: any[]): any => {
    let result = [];
    source.forEach(item => {
      item = item || {};
      let key = Object.keys(item)[0];
      if (key === this.andKey) {
        result = result.concat(this.filterSkills(item[key]))
      } else if (skillsExpr.test(key)) {
        let value = item[key];
        let expr = value['$regex'];
        result.push((expr ? '[^' + delimiter + ']*' + expr + '[^' + delimiter + ']*' : value).toLowerCase());
      }
    });
    return result;
  };

  getAll = (req, res) => {
    let or;

    try {
      or = req.query.or ? JSON.parse(req.query.or) : [];
    } catch (e) {
      console.error('Error parsing search query: ' + req.query.or);
      return res.status(500);
    }

    console.log('Initial:', JSON.stringify(or));

    let query = this.filterCriteria(or, this.cutDemand) || {};
    let assignmentsQuery = this.filterCriteria(or, new RegExp(/^assignment\./)) || {};
    let commentsQuery = this.filterCriteria(or, new RegExp(/^comments/), this.orKey, this.commentTransform) || {};
    let skillsList = this.filterSkills(or) || [];

    if (skillsList.length) {
      integrations.skillTreeGetAllSkills(fakeRes(skillIds => {
        let ids = integrations.mapSkillsIds(skillsList);
        console.log('Done', ids);

        integrations.skillTreeGetBySkills(ids)
          .then(people => {
            let skillsQuery = {
              login: {
                '$in': people.map(person => person.user_id)
              }
            };
            this._query(res, query, assignmentsQuery, commentsQuery, skillsQuery);
          })
      }));
    } else {
      this._query(res, query, assignmentsQuery, commentsQuery);
    }
  }

  _query = (res, query, assignmentsQuery, commentsQuery, skillsQuery={}) => {
    console.log('- Assignments -----------------------------------------------------');
    console.log('Assignment:', JSON.stringify(assignmentsQuery));
    console.log('Comments:', JSON.stringify(commentsQuery));
    console.log('Skills:', JSON.stringify(skillsQuery));
    console.log('The rest:', JSON.stringify(query));

    let now = new Date();
    Resource.aggregate([
      {
        '$match': skillsQuery
      },
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
        '$match': commentsQuery
      },
      {
        '$lookup': {
          from: 'assignments',
          localField: '_id',
          foreignField: 'resourceId',
          as: 'assignment'
        }
      },
      {
        '$unwind': '$assignment'
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
        '$unwind': '$initiative'
      },
      {
        '$addFields': {
          'assignment.account': '$initiative.account',
          'assignment.initiative': '$initiative.name',
          'assignment.billable': {
            '$cond': {
              if: {
                '$and': [
                  {'$in': ['$assignment.billability', ['Billable', 'Soft booked', 'PTO Coverage']]},
                  {'$or': [
                      {'$gt': ['$assignment.end', now]},
                      {'$eq': ['$assignment.end', null]}
                    ]
                  }
                ]
              },
              then: 'true',
              else: 'false'
            }
          },
          'canTravel': {
            '$cond': {
              if: {
                '$or': [
                  {'$gt': ['$visaB', now]},
                  {'$gt': ['$visaL', now]}
                ]
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
        '$match': assignmentsQuery
      },
      {
        '$group': {
          _id: '$_id',
          assignments: { '$push': '$assignment' },
          name: { '$first': '$name' },
          grade: { '$first': '$grade' },
          location: { '$first': '$location' },
          profile: { '$first': '$profile' },
          specialization: { '$first': '$specialization' },
          pool: { '$first': '$pool' },
          starts: { '$first': '$starts' },
          ends: { '$first': '$ends' },
          manager: { '$first': '$manager' },
          minDate: {
            '$min': '$assignment.start'
          },
          maxDate: {
            '$max': '$assignment.end'
          },
          billable: {
            '$max': '$assignment.billable'
          },
          canTravel: { '$first': '$canTravel' },
          login: { '$first': '$login' },
          status: { '$first': '$status' },
          commentsCount: { '$first': '$commentsCount' }
        }
      },
      {
        '$match': query
      },
      {
        '$sort': {
          name: 1
        }
      }
    ], (err, docs) => {
      if (err) { return console.error(err); }
      res.json(docs);
    });
  }
}
