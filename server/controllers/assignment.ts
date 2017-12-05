import BaseCtrl from './base';
import Assignment from '../models/assignment';
import Resource from '../models/resource';

const andKey = '$and';
const orKey = '$or';

export default class AssignmentCtrl extends BaseCtrl {
  model = Assignment;

  filterCriteria = (source: any[], filterExpression: RegExp, condition = orKey, transform: Function = (key, value) => ({[key]: value})): any => {
    let result = [];
    source.forEach(item => {
      let key = Object.keys(item)[0];
      if (key === andKey) {
        let and = this.filterCriteria(item[key], filterExpression, andKey, transform);
        if (and) {
          result.push(and);
        }
      } else if (filterExpression.test(key)) {
        result.push(transform(key, item[key]));
      }
    });
    return result.length ? (result.length === 1 ? result[0]: {[condition]: result}) : null;
  };

  commentTransform = (key, value) => {
    if (key.indexOf('.') >= 0) {
      let [comment, source] = key.split('.', 2);
      return {[andKey]: [{'comment.source': source}, {'comment.text': value}]};
    } else {
      key += '.text';
    }
    return {[key]: value};
  }

  getAll = (req, res) => {
    let query = {};
    let assignmentsQuery = {};
    let commentsQuery = {};
    let or;

    try {
      or = req.query.or ? JSON.parse(req.query.or) : [];
    } catch (e) {
      console.error('Error parsing search query: ' + req.query.or);
      return res.status(500);
    }

    query = this.filterCriteria(or, new RegExp(/^([^c]|c[^o])[^.]+$/)) || {};
    assignmentsQuery = this.filterCriteria(or, new RegExp(/^assignment\./)) || {};
    commentsQuery = this.filterCriteria( or, new RegExp(/^comment/), orKey, this.commentTransform) || {};

    console.log('------------------------------------------------------');
    console.log('Initial:', JSON.stringify(or));
    console.log('Assignment:', JSON.stringify(assignmentsQuery));
    console.log('Comment:', JSON.stringify(commentsQuery));
    console.log('The rest:', JSON.stringify(query));

    let now = new Date();
    Resource.aggregate([
      {
        '$lookup': {
          from: 'comments',
          localField: 'login',
          foreignField: 'login',
          as: 'comment'
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
              if: {'$in': ['$assignment.billability', ['Billable', 'Soft booked', 'PTO Coverage']]},
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
                  input: '$comment',
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
          status: { '$first': '$status' }
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
