import Requisition from '../models/requisition';
import Candidate from '../models/candidate';
import BaseCtrl from './base';

export default class CandidateCtrl extends BaseCtrl {
  model = Candidate;
  limit = 1000;

  modifiers = {
    include: ['requisition', 'candidate', 'comments'],
    requisition: this.requisitionTransform,
    comments: this.candidateCommentTransform
  };

  requisitionTransform(key, value) {
    key = key.replace('requisition.', '');
    return {[key]: value};
  }

  candidateCommentTransform(key, value) {
    return this.commentTransform(key, value, 'candidate');
  }

  // Get all
  getAll = (req, res) => {
    let or;
    try {
      or = req.query.or ? JSON.parse(req.query.or) : [];
    } catch (e) {
      console.error('Error parsing search query: ' + req.query.or);
      return res.status(500);
    }

    let query = this.fixOr(this.modifyCriteria(or, this.modifiers));
    this.limit = Object.keys(query).length ? 1000 : 100;

    console.log('- Requisitions & Candidates -------------------------------------------');
    console.log('Initial:', JSON.stringify(or));
    console.log('Query:', JSON.stringify(query));

    Requisition
      .aggregate([
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
          '$match': query
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
          }
        },
        {
          '$addFields': {
            demands: {
              '$setDifference': ['$demands', [null]]
            },
            candidates: {
              '$setDifference': ['$candidates', [{comments: [], commentsCount: 0}]]
            }
          }
        },
        {
          '$sort': {
            requisitionId: 1
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
