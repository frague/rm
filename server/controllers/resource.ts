import Resource from '../models/resource';
import Assignment from '../models/assignment';
import BaseCtrl from './base';

export default class ResourceCtrl extends BaseCtrl {
  model = Resource;

  cleanup = (req, res) => {
    Assignment.deleteMany({resourceId: req.params.id}, (err) => {
      if (err) { return console.error(err); }
      res.sendStatus(200);
    })
  }

	getAll = (req, res) => {
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
          commentsCount: {'$size': '$comments'},
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
        '$project': {
          name: 1,
          login: 1,
          grade: 1,
          location: 1,
          profile: 1,
          specialization: 1,
          pool: 1,
          manager: 1,
          skype: 1,
          phone: 1,
          room: 1,
          passport: 1,
          visaB: 1,
          visaL: 1,
          license: 1,
          status: 1,
          commentsCount: 1
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
