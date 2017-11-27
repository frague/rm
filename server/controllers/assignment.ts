import BaseCtrl from './base';
import Assignment from '../models/assignment';
import Resource from '../models/resource';

export default class AssignmentCtrl extends BaseCtrl {
  model = Assignment;

  extractCriteria = (source: any[], needle: string, destination: any[]|any, condition: string) => {
    let result = source.reduce((result, criterion) => {
      console.log('Criterion', criterion);
      let key = Object.keys(criterion)[0];
      if (key.indexOf('$') === 0 || key.indexOf('demand') === 0) {
        // ignore demand queries and stricts
        return result;
      } else if (key.indexOf(needle) >= 0) {
        destination.push(criterion);
      } else {
        result.push(criterion);
      }
      return result;
    }, []);
    return result.length ? {[condition]: result} : {};
  };

  getAll = (req, res) => {
    let query = {};
    let assignmentsQuery = {};

    let or = req.query.or;
    if (or) {
      or = JSON.parse(or);
      let assignmentsOr: any = [];
      let queryOr = this.extractCriteria(or, 'assignment', assignmentsOr, '$or');
      assignmentsOr = assignmentsOr.length ? {'$or': assignmentsOr} : [];

      let and = or.filter(criterion => !!criterion['$and']);
      let assignmentsAnd: any = [];
      if (and.length) {
        let queryAnd = this.extractCriteria(and[0]['$and'], 'assignment', assignmentsAnd, '$and');
        assignmentsAnd = assignmentsAnd.length ? {'$and': assignmentsAnd} : [];

        if (queryAnd['$and']) {
          if (queryOr['$or']) {
            queryOr['$or'].push(queryAnd);
          } else {
            queryOr = queryAnd;
          }
        }
      }

      query = Object.keys(queryOr).length > 0 ? queryOr : {};

      if (assignmentsAnd['$and']) {
        if (assignmentsOr['$or']) {
          assignmentsOr['$or'].push(assignmentsAnd);
        } else {
          assignmentsOr = assignmentsAnd;
        }
      }
      assignmentsQuery = Object.keys(assignmentsOr).length > 0 ? assignmentsOr : {};

      console.log('------------------------------------------------------');
      console.log(JSON.stringify(or));
      console.log(JSON.stringify(query), JSON.stringify(assignmentsQuery));
    }

    let now = new Date();
    Resource.aggregate([
      {
        '$lookup': {
          from: 'comments',
          localField: 'login',
          foreignField: 'login',
          as: 'status'
        }
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
                  input: '$status',
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
