import Demand from '../models/demand';
import BaseCtrl from './base';
import { printTitle } from '../utils';

const demandColumns = [
  'name',
  'account',
  'accountId',
  'project',
  'pool',
  'role',
  'profile',
  'specializations',
  'start',
  'end',
  'deployment',
  'stage',
  'isBooked',
  'grades',
  'locations',
  'requestId',
  'requirements',
  'comment',
  'candidates',
  'login',
  'duration',
];

export default class DemandCtrl extends BaseCtrl {
  model = Demand;

  modifiers = {
    include: ['demand'],
    demand: (key, value) => {
      if (key === 'demand') return;
      key = key.replace('demand.', '');
      return {[key]: value};
    },
  };

  baseModifiers = {
    include: ['demand'],
    demand: (key, value) => {
      key = key.replace('demand.', '');
      if (!demandColumns.includes(key)) return;
      return {[key]: value};
    },
  };

  get = (req, res) => {
    this.model.findOne({login: req.params.id}, (err, obj) => {
      if (err) {
        return console.error(err);
      }
      res.json(obj);
    });
  }

  getAll = (req, res) => {
    printTitle('Demand');

    let now = new Date();
    let or;
    try {
      or = req.query.or ? JSON.parse(req.query.or) : [];
    } catch (e) {
      console.error('Error parsing search query: ' + req.query.or);
      return res.status(500);
    }

    let order = this.determineOrder(req, {login: 1});
    let query = this.fixOr(this.modifyCriteria(or, this.modifiers));
    let baseQuery = this.fixOr(this.modifyCriteria(or, this.baseModifiers));

    console.log('Initial:', JSON.stringify(or));
    console.log('Query:', JSON.stringify(query));
    console.log('Base query:', JSON.stringify(baseQuery));

    this.model
      .aggregate()
      .match(baseQuery)
      .lookup({
        from: 'comments',
        localField: 'login',
        foreignField: 'login',
        as: 'comments'
      })
      .addFields({
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
        isBillable: {
          '$toString': {
            '$in': ['$role', ['Billable', 'Booked', 'PTO Coverage', 'Funded']]
          }
        }
      })
      .unwind({
        path: '$requestId',
        preserveNullAndEmptyArrays: true
      })
      .lookup({
        from: 'requisitions',
        let: {
          id: '$requestId'
        },
        pipeline: [
          {
            '$match': {
              '$expr': {
                '$eq': ['$$id', '$requisitionId']
              }
            }
          }
        ],
        as: 'requisition'
      })
      .group({
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
        isBooked: { '$first': '$isBooked' },
        grades: { '$first': '$grades' },
        locations: { '$first': '$locations' },
        requestId: { '$push': '$requestId' },
        requirements: { '$first': '$requirements' },
        specializations: { '$first': '$specializations' },
        candidates: { '$first': '$candidates' },
        login: { '$first': '$login' },
        comment: { '$first': '$comment' },
        commentsTemp: {'$first': '$comments'},
        commentsCount: { '$first': '$commentsCount' },
        status: { '$first': '$status' },
        isBillable: { '$first': '$isBillable' },
        duration: { '$first': '$duration' },
        requisitionsStates: { '$push': {
          '$cond': {
            if: {'$gt': [{'$size': '$requisition.jobState'}, 0]},
            then: {'$arrayElemAt': ['$requisition.jobState', 0]},
            else: null
          }
        }}
      })
      .addFields({
        requestId: {
          '$cond': {
            if: {
              '$eq': ['$requestId', ['']]
            },
            then: [],
            else: '$requestId'
          }
        },
        comments: {
          '$arrayToObject': {
            '$map': {
              input: '$commentsTemp',
              as: 'comment',
              in: [
                {
                  '$cond': {
                    if: '$$comment.source',
                    then: '$$comment.source',
                    else: '0',
                  }
                },
                '$$comment.text'
              ]
            }
          }
        }
      })
      .match(query)
      .sort(order)
      .project({
        _id: 1,
        account: 1,
        name: 1,
        pool: 1,
        role: 1,
        profile: 1,
        project: 1,
        start: 1,
        end: 1,
        deployment: 1,
        stage: 1,
        isBooked: 1,
        grades: 1,
        locations: 1,
        requestId: 1,
        requirements: 1,
        specializations: 1,
        candidates: 1,
        login: 1,
        comment: 1,
        comments: '$commentsTemp',
        commentsCount: 1,
        status: 1,
        isBillable: 1,
        requisitionsStates: 1,
        duration: 1,
      })
      .exec()
      .then(data => {
        console.log(`Records matched: ${data && data.length}`);
        return res.json(data)
      })
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
