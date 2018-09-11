import Demand from '../models/demand';
import BaseCtrl from './base';

export default class DemandCtrl extends BaseCtrl {
  model = Demand;

  modifiers = {
    include: ['demand', 'comments'],
    demand: this.demandTransform,
    comments: this.commentTransform
  };

  demandTransform(key, value) {
    if (key === 'demand') return;  // For cases with demand='true'|'false'|'only'
    key = key.replace('demand.', '');
    return {[key]: value};
  }

  get = (req, res) => {
    this.model.findOne({login: req.params.id}, (err, obj) => {
      if (err) {
        return console.error(err);
      }
      res.json(obj);
    });
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

    this.model
      .aggregate([
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
            },
            requisition: {'$split': ['$requestId', ',']}
          }
        },
        {
          '$unwind': {
            path: '$requisition',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          '$lookup': {
            from: 'requisitions',
            localField: 'requisition',
            foreignField: 'requisitionId',
            as: 'req'
          }
        },
        {
          '$group': {
            _id: '$_id',
            account: { '$first': '$account' },
            name: { '$first': '$name' },
            pool: { '$first': '$pool' },
            role: { '$first': '$role' },
            profile: { '$first': '$profile' },
            project: { '$first': '$project' },
            start: { '$first': '$start' },
            end: { '$first': '$end' },
            deployment: { '$first': '$deployment' },
            stage: { '$first': '$stage' },
            grades: { '$first': '$grades' },
            locations: { '$first': '$locations' },
            requestId: { '$first': '$requestId' },
            requirements: { '$first': '$requirements' },
            comment: { '$first': '$comment' },
            specializations: { '$first': '$specializations' },
            candidates: { '$first': '$candidates' },
            login: { '$first': '$login' },
            commentsCount: { '$first': '$commentsCount' },
            status: { '$first': '$status' },
            requisitionsStates: { '$push': {
              '$cond': {
                if: '$req',
                then: {
                  '$arrayElemAt': ['$req.jobState', 0]
                },
                else: null
              }
            } },
          }
        },
        {
          '$match': query
        },
        {
          '$sort': {
            login: 1
          }
        }
      ]
    )
    .cursor({})
    .exec()
    .toArray()
    .then(data => res.json(data))
    .catch(error => {
      console.log('Error', error);
      res.sendStatus(500);
    });
  }

  cleanup = (req, res) => {
    Demand.deleteMany({}, (err) => {
      if (err) { return console.error(err); }
      res.sendStatus(200);
    })
  };
}
