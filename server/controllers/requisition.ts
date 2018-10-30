import Requisition from '../models/requisition';
import Candidate from '../models/candidate';
import BaseCtrl from './base';

export default class RequisitionCtrl extends BaseCtrl {
  model = Requisition;
  limit = 1000;

  modifiers = {
    include: ['candidate', 'comments'],
    comments: this.candidateCommentTransform
  };

  requisitionModifiers = {
    include: ['requisition'],
    requisition: this.requisitionTransform,
  };

  requisitionTransform(key, value) {
    key = key.replace('requisition.', '');
    return {[key]: value};
  }

  candidateCommentTransform(key, value) {
    return this.commentTransform(key, value, 'candidate');
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
  getAll = (req, res) => {
    let or;
    try {
      or = req.query.or ? JSON.parse(req.query.or) : [];
    } catch (e) {
      console.error('Error parsing search query: ' + req.query.or);
      return res.sendStatus(500);
    }

    let requisitionQuery = this.fixOr(this.modifyCriteria(or, this.requisitionModifiers));
    let query = this.fixOr(this.modifyCriteria(or, this.modifiers));
    this.limit = (Object.keys(query).length || Object.keys(requisitionQuery).length) ? 1000 : 100;

    console.log('- Requisitions & Candidates -------------------------------------------');
    console.log('Initial:', JSON.stringify(or));
    console.log('Requisition query:', JSON.stringify(requisitionQuery));
    console.log('Query:', JSON.stringify(query));

    this.model
      .aggregate([
        {
          '$match': requisitionQuery
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
          '$lookup': {
            from: 'comments',
            localField: 'candidate.login',
            foreignField: 'login',
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
          '$match': query
        },
        {
          '$sort': {
            'candidate.updated': -1
          }
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
          '$sort': {
            index: -1
          }
        },
        {
          '$limit': this.limit
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
}
