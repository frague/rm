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
  'candidatesStati',
  'login',
  'duration',
];

export default class DemandCtrl extends BaseCtrl {
  model = Demand;

  baseModifiers = {
    include: ['demand', 'login'],
    demand: (key, value) => {
      if (key === 'demand') return;
      if (!key.includes('.comments')) {
        key = key.replace('demand.', '');
        if (!demandColumns.includes(key)) return;
        return {[key]: value};
      }
    },
  };

  finalModifiers = {
    include: ['demand'],
    demand: (key, value) => {
      if (key === 'demand') return;
      key = key.replace('demand.', '');
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

  getAll = async (req, res) => {
    printTitle('Demand');

    let now = new Date();
    let or;
    try {
      or = req.query.or ? JSON.parse(req.query.or) : [];
    } catch (e) {
      console.error('Error parsing search query: ' + req.query.or);
      return res.status(500);
    }
    or = await this.updateOr(or, 'demand');

    let order = this.determineOrder(req, {login: 1});
    let baseQuery = this.fixOr(this.modifyCriteria(or, this.baseModifiers));
    let finalQuery = this.fixOr(this.modifyCriteria(or, this.finalModifiers));

    console.log('Initial:', JSON.stringify(or));
    console.log('Base query:', JSON.stringify(baseQuery));
    console.log('Final query:', JSON.stringify(finalQuery));

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
        comments: {
          '$arrayToObject': {
            '$map': {
              input: '$comments',
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
        candidatesStati: { '$first': '$candidatesStati' },
        login: { '$first': '$login' },
        comment: { '$first': '$comment' },
        comments: { '$first': '$comments' },
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
      })
      .match(finalQuery)
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
        candidatesStati: 1,
        login: 1,
        comment: 1,
        comments: 1,
        commentsCount: 1,
        status: 1,
        isBillable: 1,
        requisitionsStates: 1,
        duration: 1,
      })
      .exec()
      .then(data => {
        console.log(`Demand: ${data && data.length} records matched`);
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
