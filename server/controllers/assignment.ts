import BaseCtrl from './base';
import Assignment from '../models/assignment';
import Resource from '../models/resource';

export default class AssignmentCtrl extends BaseCtrl {
  model = Assignment;

  getAll = (req, res) => {
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
        '$project': {
          _id: 1,
          name: 1,
          assignments: 1,
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
      }
    ], (err, docs) => {
      if (err) { return console.error(err); }
      res.json(docs);
    });
  }
}
