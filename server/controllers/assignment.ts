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
        '$match': assignmentsQuery
      },
      {
        '$project': {
          _id: 1,
          name: 1,
          assignments: 1,
          grade: 1,
          location: 1,
          profile: 1,
          specialization: 1,
          pool: 1,
          starts: 1,
          ends: 1,
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
