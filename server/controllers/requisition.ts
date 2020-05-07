import Requisition from '../models/requisition';
import Candidate from '../models/candidate';
import BaseCtrl from './base';

import { printTitle } from '../utils';

export default class RequisitionCtrl extends BaseCtrl {
  model = Requisition;
  limit = 1000;

  private _getModifiers = (model: string, isFinal: boolean, preservePrefix: boolean): any => {
    return {
      include: isFinal ? [model] : [model, 'login'],
      [model]: isFinal ?
        (key, value) => {
          if (!preservePrefix) key = key.replace(`${model}.`, '');
          return {[key]: value};
        } :
        (key, value) => {
          if (!key.includes('.comments')) {
            if (!preservePrefix) key = key.replace(`${model}.`, '');
            return {[key]: value};
          }
        },
      login: (key, value) => {
        return {[preservePrefix ? `${model}.${key}` : key]: value};
      }
    };
  }

  // Get by id
  get = (req, res) => {
    this.model.findOne({ requisitionId: req.params.id }, (err, obj) => {
      if (err) {
        return this._respondWithError(res, err);
      }
      res.json(obj);
    });
  }

  // Get all
  getAll = async (req, res) => {
    printTitle('Requisitions & Candidates');

    let or, order;
    try {
      or = req.query.or ? JSON.parse(req.query.or) : [];
    } catch (e) {
      console.error('Error parsing search query: ' + req.query.or);
      return res.sendStatus(500);
    }

    let ors = {
      candidate: await this.updateOr(or, 'candidate'),
      requisition: await this.updateOr(or, 'requisition'),
    };
    let makeQuery = (model: string, isFinal: boolean, preservePrefix: boolean) => {
      let query = this.fixOr(this.modifyCriteria(ors[model], this._getModifiers(model, isFinal, preservePrefix)));
      // console.log(`${model} ${isFinal ? 'final' : 'base'} ${preservePrefix ? 'prefixed' : 'trimmed'}:`, JSON.stringify(query));
      console.log(`${model} ${isFinal ? 'final' : 'base'} ${preservePrefix ? 'prefixed' : 'trimmed'}:`, query);
      return query;
    };

    let requisitionsQuery = makeQuery('requisition', true, false);
    let candidatesQuery = makeQuery('candidate', true, false);

    this.limit = (Object.keys(requisitionsQuery).length || Object.keys(candidatesQuery).length) ? 1000 : 100;
    order = this.determineOrder(req);

    console.log('Order:', JSON.stringify(order));

    if (Object.keys(requisitionsQuery).length) {
      console.log('Primary filtering: requisition');
      // Filter by requisition properties first
      return Requisition
        .aggregate()
        .match(makeQuery('requisition', false, false))

        // Lookup requisitions comments
        .lookup({
          from: 'comments',
          localField: 'requisitionId',
          foreignField: 'login',
          as: 'comments'
        })
        .addFields({
          'commentsCount': {'$size': '$comments'},
          'status': {
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
        })
        .match(requisitionsQuery)

        // Lookup candidates
        .lookup({
          from: 'candidates',
          localField: 'requisitionId',
          foreignField: 'requisitionId',
          as: 'candidate'
        })
        .unwind({
          path: '$candidate',
          preserveNullAndEmptyArrays: true
        })
        .match(makeQuery('candidate', false, true))

        // Lookup candidates comments
        .lookup({
          from: 'comments',
          let: {
            login: '$candidate.login'
          },
          pipeline: [{
            '$match': {
              '$expr': {
                '$eq': ['$login', '$$login']
              }
            }
          }],
          as: 'candidate.comments'
        })
        .addFields({
          'candidate.commentsCount': {'$size': '$candidate.comments'},
          'candidate.status': {
            '$arrayElemAt': [
              {
                '$filter': {
                  input: '$candidate.comments',
                  as: 'status',
                  cond: {
                    '$eq': ['$$status.isStatus', true]
                  }
                }
              },
              0
            ]
          },
          'candidate.comments': {
            '$arrayToObject': {
              '$map': {
                input: '$candidate.comments',
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
        })
        .match(makeQuery('candidate', true, true))
        .sort({
          'candidate.updated': -1,
          'candidate.state': -1,
        })

        // Group by requisition
        .group({
          _id: '$_id',
          category: {'$first': '$category'},
          department: {'$first': '$department'},
          detailLink: {'$first': '$detailLink'},
          internalOnly: {'$first': '$internalOnly'},
          jobState: {'$first': '$jobState'},
          jobType: {'$first': '$jobType'},
          location: {'$first': '$location'},
          postingType: {'$first': '$postingType'},
          requisitionId: {'$first': '$requisitionId'},
          eId: {'$first': '$eId'},
          title: {'$first': '$title'},
          candidates: {'$push': '$candidate'},
          status: {'$first': '$status'},
          commentsCount: {'$first': '$commentsCount'},
        })

        .sort(order)

        // Lookup requisitions demands
        .lookup({
          from: 'requisitiondemands',
          localField: 'requisitionId',
          foreignField: 'requisitionId',
          as: 'rd'
        })
        .addFields({
          demandLogin: {
            '$arrayElemAt': ['$rd.demandIds', 0]
          }
        })
        .unwind({
          path: '$demandLogin',
          preserveNullAndEmptyArrays: true
        })
        .lookup({
          from: 'demands',
          localField: 'demandLogin',
          foreignField: 'login',
          as: 'demand'
        })
        .addFields({
          'd': {
            '$cond': {
              if: '$demandLogin',
              then: {
                id: '$demandLogin',
                login: {
                  '$arrayElemAt': ['$demand.login', 0]
                },
                locations: '$demand.locations',
              },
              else: null
            }
          }
        })
        .group({
          _id: '$_id',
          category: { '$first': '$category' },
          demands: { '$push': '$d' },
          department: { '$first': '$department' },
          detailLink: { '$first': '$detailLink' },
          eId: { '$first': '$eId' },
          internalOnly: { '$first': '$internalOnly' },
          jobState: { '$first': '$jobState' },
          jobType: { '$first': '$jobType' },
          location: { '$first': '$location' },
          postingType: { '$first': '$postingType' },
          requisitionId: { '$first': '$requisitionId' },
          title: { '$first': '$title' },
          candidates: {'$first': '$candidates'},
          status: {'$first': '$status'},
          commentsCount: {'$first': '$commentsCount'},
        })
        .addFields({
          demands: {
            '$setDifference': ['$demands', [null]]
          },
          candidates: {
            '$setDifference': ['$candidates', [{comments: {}, commentsCount: 0}]]
          },
          index: {
            '$convert': {
              input: {
                '$ltrim': {
                  input: '$requisitionId',
                  chars: 'GDHR-'
                }
              },
              to: 'int'
            }
          }
        })
        .sort(order)
        .limit(this.limit)
        .exec()
        .then(data => {
          console.log(`Records matched: ${data && data.length}`);
          return res.json(data)
        })
        .catch(error => {
          console.log('Error', error);
          res.sendStatus(500);
        });
    } else {
      console.log('Primary filtering: candidate');

      // Filter by candidates properties first
      Candidate
        .aggregate()
        .match(makeQuery('candidate', false, false))

        .lookup({
          from: 'comments',
          let: {
            login: '$login'
          },
          pipeline: [{
            '$match': {
              '$expr': {
                '$eq': ['$login', '$$login']
              }
            }
          }],
          as: 'comments'
        })
        .addFields({
          'commentsCount': {'$size': '$comments'},
          'status': {
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
        })
        .match(makeQuery('candidate', true, false))

        .lookup({
          from: 'requisitions',
          localField: 'requisitionId',
          foreignField: 'requisitionId',
          as: 'requisition'
        })
        .addFields({
          candidateId: '$_id'
        })
        .project({
          _id: '$requisition._id',
          category: '$requisition.category',
          department: '$requisition.department',
          detailLink: '$requisition.detailLink',
          internalOnly: '$requisition.internalOnly',
          jobState: '$requisition.jobState',
          jobType: '$requisition.jobType',
          location: '$requisition.location',
          postingType: '$requisition.postingType',
          requisitionId: '$requisition.requisitionId',
          eId: '$requisition.eId',
          title: '$requisition.title',
          candidate: {
            login: '$login',
            name: '$name',
            country: '$country',
            city: '$city',
            location: '$location',
            profile: '$profile',
            state: '$state',
            updated: '$updated',
            requisitionId: '$requisitionId',
            applicationId: '$applicationId',
            comments: '$comments',
            commentsCount: '$commentsCount',
            status: '$status',
          }
        })
        .group({
          _id: '$_id',
          category: {'$first': '$category'},
          department: {'$first': '$department'},
          detailLink: {'$first': '$detailLink'},
          internalOnly: {'$first': '$internalOnly'},
          jobState: {'$first': '$jobState'},
          jobType: {'$first': '$jobType'},
          location: {'$first': '$location'},
          postingType: {'$first': '$postingType'},
          requisitionId: {'$first': '$requisitionId'},
          eId: {'$first': '$eId'},
          title: {'$first': '$title'},
          candidates: {'$push': '$candidate'},
        })
        .lookup({
          from: 'comments',
          localField: 'requisitionId',
          foreignField: 'login',
          as: 'comments'
        })
        .addFields({
          'commentsCount': {'$size': '$comments'},
          'status': {
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
        })
        .sort(order)

        .lookup({
          from: 'requisitiondemands',
          localField: 'requisitionId',
          foreignField: 'requisitionId',
          as: 'rd'
        })
        .addFields({
          demandLogin: {
            '$arrayElemAt': ['$rd.demandIds', 0]
          }
        })
        .unwind({
          path: '$demandLogin',
          preserveNullAndEmptyArrays: true
        })
        .lookup({
          from: 'demands',
          localField: 'demandLogin',
          foreignField: 'login',
          as: 'demand'
        })

        // TODO: Check if this left after debugging
        .addFields({
          'd': {
            '$cond': {
              if: '$demandLogin',
              then: {
                id: '$demandLogin',
                login: {
                  '$arrayElemAt': ['$demand.login', 0]
                },
                locations: '$demand.locations',
              },
              else: null
            }
          }
        })
        .addFields({
          demands: {
            '$setDifference': ['$demands', [null]]
          },
          candidates: {
            '$setDifference': ['$candidates', [{comments: [], commentsCount: 0}]]
          },
        })
        .sort(order)
        .limit(this.limit)
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

  }
}
