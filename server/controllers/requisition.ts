import Requisition from '../models/requisition';
import Candidate from '../models/candidate';
import BaseCtrl from './base';

import { printTitle } from '../utils';

export default class RequisitionCtrl extends BaseCtrl {
  model = Requisition;
  limit = 1000;

  commentsModifiers = {
    include: ['comments'],
    comments: (key, value) => this.commentTransform(key, value, 'candidate')
  };

  requisitionsModifiers = {
    include: ['requisition'],
    requisition: (key, value) => {
      if (key === 'requisitions') {  // Exclude requsitions=true/false from becoming a condition
        return false;
      }
      key = key.replace('requisition.', '');
      return {[key]: value};
    },
  };

  candidatesModifiers = {
    include: ['candidate'],
    candidate: (key, value) => {
      if (key === 'candidates') {  // Exclude candidates=true/false from becoming a condition
        return false;
      }
      key = key.replace('candidate.', '');
      return {[key]: value};
    },
  };

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
  getAll = (req, res) => {
    printTitle('Requisitions & Candidates');

    let or, order;
    try {
      or = req.query.or ? JSON.parse(req.query.or) : [];
    } catch (e) {
      console.error('Error parsing search query: ' + req.query.or);
      return res.sendStatus(500);
    }

    let requisitionsQuery = this.fixOr(this.modifyCriteria(or, this.requisitionsModifiers));
    let candidatesQuery = this.fixOr(this.modifyCriteria(or, this.candidatesModifiers));
    let commentsQuery = this.fixOr(this.modifyCriteria(or, this.commentsModifiers));
    this.limit = (Object.keys(commentsQuery).length || Object.keys(requisitionsQuery).length) ? 1000 : 100;
    order = this.determineOrder(req);

    console.log('Initial:', JSON.stringify(or));
    console.log('Requisitions query:', JSON.stringify(requisitionsQuery));
    console.log('Candidates query:', JSON.stringify(candidatesQuery));
    console.log('Comments query:', JSON.stringify(commentsQuery));
    console.log('Order:', JSON.stringify(order));

    if (Object.keys(requisitionsQuery).length) {
      // Filter by requisition properties first
      return this.model
        .aggregate([
          {
            '$match': requisitionsQuery
          },
          {
            '$lookup': {
              from: 'candidates',
              localField: 'requisitionId',
              foreignField: 'requisitionId',
              as: 'candidate'
            }
          },
          {
            '$unwind': {
              path: '$candidate',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            '$match': candidatesQuery
          },
          {
            '$lookup': {
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
            }
          },
          {
            '$addFields': {
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
              }
            }
          },
          {
            '$lookup': {
              from: 'comments',
              localField: 'requisitionId',
              foreignField: 'login',
              as: 'comments'
            }
          },
          {
            '$addFields': {
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
            }
          },
          {
            '$match': commentsQuery
          },
          {
            '$sort': order
          },
          {
            '$group': {
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
            }
          },
          {
            '$lookup': {
              from: 'requisitiondemands',
              localField: 'requisitionId',
              foreignField: 'requisitionId',
              as: 'rd'
            }
          },
          {
            '$addFields': {
              demandLogin: {
                '$arrayElemAt': ['$rd.demandIds', 0]
              }
            }
          },
          {
            '$unwind': {
              path: '$demandLogin',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            '$lookup': {
              from: 'demands',
              localField: 'demandLogin',
              foreignField: 'login',
              as: 'demand'
            }
          },
          {
            '$addFields': {
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
            }
          },
          {
            '$group': {
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
            }
          },
          {
            '$addFields': {
              demands: {
                '$setDifference': ['$demands', [null]]
              },
              candidates: {
                '$setDifference': ['$candidates', [{comments: [], commentsCount: 0}]]
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
            }
          },
          {
            '$sort': order
          },
          {
            '$limit': this.limit
          }
        ]
      )
      .then(data => {
        console.log(`Records matched: ${data && data.length}`);
        return res.json(data)
      })
      .catch(error => {
        console.log('Error', error);
        res.sendStatus(500);
      });
    } else {
      // Filter by candidates properties first
      Candidate
        .aggregate([
          {
            '$match': candidatesQuery
          },
          {
            '$lookup': {
              from: 'requisitions',
              localField: 'requisitionId',
              foreignField: 'requisitionId',
              as: 'requisition'
            }
          },
          {
            '$addFields': {
              candidateId: '$_id'
            }
          },
          {
            '$unwind': {
              path: '$requisition',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            '$match': requisitionsQuery
          },
          {
            '$lookup': {
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
            }
          },
          {
            '$addFields': {
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
              }
            }
          },
          {
            '$lookup': {
              from: 'comments',
              localField: 'requisitionId',
              foreignField: 'login',
              as: 'comments'
            }
          },
          {
            '$addFields': {
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
            }
          },
          {
            '$match': commentsQuery
          },
          {
            '$sort': order
          },
          {
            '$lookup': {
              from: 'requisitiondemands',
              localField: 'requisitionId',
              foreignField: 'requisitionId',
              as: 'rd'
            }
          },
          {
            '$addFields': {
              demandLogin: {
                '$arrayElemAt': ['$rd.demandIds', 0]
              }
            }
          },
          {
            '$unwind': {
              path: '$demandLogin',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            '$lookup': {
              from: 'demands',
              localField: 'demandLogin',
              foreignField: 'login',
              as: 'demand'
            }
          },
          {
            '$addFields': {
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
            }
          },
          {
            '$addFields': {
              demands: {
                '$setDifference': ['$demands', [null]]
              },
              candidates: {
                '$setDifference': ['$candidates', [{comments: [], commentsCount: 0}]]
              },
            }
          },
          {
            '$sort': order
          },
          {
            '$limit': this.limit
          }
        ]
      )
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
