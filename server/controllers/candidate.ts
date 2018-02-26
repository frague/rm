import Candidate from '../models/candidate';
import BaseCtrl from './base';

export default class CandidateCtrl extends BaseCtrl {
  model = Candidate;

  modifiers = {
    include: ['candidate', 'comments'],
    candidate: this.candidateTransform,
    comments: this.commentTransform
  };

  candidateTransform(key, value) {
    key = key.replace('candidate.', '');
    return {[key]: value};
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

    console.log('- Candidates ------------------------------------------------------');
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
        '$lookup': {
          from: 'requisitions',
          localField: 'requisitionId',
          foreignField: 'requisitionId',
          as: 'requisition'
        }
      },
      {
        '$unwind': {
          path: '$requisition',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        '$match': query
      },
      {
        '$sort': {
          requisitionId: 1,
          state: -1,
          updated: -1
        }
      }
    ], (err, docs) => {
      if (err) { return console.error(err); }
      res.json(docs);
    });
  }
}
