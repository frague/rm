import BaseCtrl from './base';
import Assignment from '../models/assignment';
import Resource from '../models/resource';

export default class AssignmentCtrl extends BaseCtrl {
  model = Assignment;

  getAll = (req, res) => {
    let assignmentsQuery = {};
    let query =Object.keys(req.query).reduce((result, key) => {
      let value = JSON.parse(req.query[key]);
      if (key.indexOf('assignments') >= 0) {
        assignmentsQuery[key.replace('assignments.', 'assignments.')] = value;
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
          as: 'assignments'
        }
      },
      {
        '$unwind': '$assignments'
      },
      {
        '$match': assignmentsQuery
      },
      {
        '$group': {
          _id: '$_id', 
          assignments: { '$push': '$assignments' },
          name: { '$first': '$name' },
          grade: { '$first': '$grade' },
          location: { '$first': '$location' },
          profile: { '$first': '$profile' },
          specialization: { '$first': '$specialization' },
          pool: { '$first': '$pool' },
          starts: { '$first': '$starts' },
          ends: { '$first': '$ends' },
          minDate: {
            $min: '$assignments.start'
          },
          maxDate: {
            $max: '$assignments.end'
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
