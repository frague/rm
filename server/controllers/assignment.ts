import BaseCtrl from './base';
import Assignment from '../models/assignment';
import Resource from '../models/resource';

export default class AssignmentCtrl extends BaseCtrl {
  model = Assignment;

  cutDemand = key => {
    return key.indexOf('demand') && key.indexOf('comment');
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

    query = this.filterCriteria(or, this.cutDemand) || {};
    assignmentsQuery = this.filterCriteria(or, new RegExp(/^assignment\./)) || {};
    commentsQuery = this.filterCriteria(or, new RegExp(/^comments/), this.orKey, this.commentTransform) || {};

    console.log('------------------------------------------------------');
    console.log('Initial:', JSON.stringify(or));
    console.log('Assignment:', JSON.stringify(assignmentsQuery));
    console.log('Comments:', JSON.stringify(commentsQuery));
    console.log('The rest:', JSON.stringify(query));

    let now = new Date();
    Resource.aggregate([
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
