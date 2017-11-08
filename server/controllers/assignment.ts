import BaseCtrl from './base';
import Assignment from '../models/assignment';
import Resource from '../models/resource';

export default class AssignmentCtrl extends BaseCtrl {
  model = Assignment;

  getAll = (req, res) => {
    let assignmentsQuery = {};
    let query =Object.keys(req.query).reduce((result, key) => {
      let value = JSON.parse(req.query[key]);
      if (key.indexOf('assignment') >= 0) {
        assignmentsQuery[key] = value;
      } else {
        result[key] = value;
      }
      return result;
    }, {});
    console.log(query, assignmentsQuery);
    Resource.aggregate([
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
          'assignment.initiative': '$initiative.name'
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
            $min: '$assignment.start'
          },
          maxDate: {
            $max: '$assignment.end'
          }
        }
      },
      {
        '$sort': {
          name: 1
        }
      },
      {
        '$match': query
      }
    ], (err, docs) => {
      if (err) { return console.error(err); }
      res.json(docs);
    });
  }
}
