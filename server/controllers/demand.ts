import Demand from '../models/demand';
import BaseCtrl from './base';


export default class DemandCtrl extends BaseCtrl {
  model = Demand;

  modifiers = {
    include: ['demand'],
    demand: this.demandTransform
  };

  demandTransform(key, value) {
    key = key.replace('demand.', '');
    return {[key]: value};
  }

  getAll = (req, res) => {
    let or;
    try {
      or = req.query.or ? JSON.parse(req.query.or) : [];
    } catch (e) {
      console.error('Error parsing search query: ' + req.query.or);
      return res.status(500);
    }

    let query = this.fixOr(this.modifyCriteria(or, this.modifiers));

    console.log('- Demand ----------------------------------------------------------');
    console.log('Initial:', JSON.stringify(or));
    console.log('Query:', JSON.stringify(query));

    this.model.aggregate([
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
        '$match': query
      },
      {
        '$project': {
          account: 1,
          pool: 1,
          acknowledgement: 1,
          role: 1,
          profile: 1,
          start: 1,
          end: 1,
          deployment: 1,
          stage: 1,
          grades: 1,
          locations: 1,
          requestId: 1,
          comment: 1,
          login: 1,
          commentsCount: 1,
          status: 1
        }
      },
      {
        '$sort': {
          login: 1
        }
      }
    ], (err, docs) => {
      if (err) { return console.error(err); }
      res.json(docs);
    });

  }

  cleanup = (req, res) => {
    Demand.deleteMany({}, (err) => {
      if (err) { return console.error(err); }
      res.sendStatus(200);
    })
  };
}
