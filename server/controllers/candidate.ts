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
          '$project': {
            applicationId: 1,
            city: 1,
            comments: 1,
            commentsCount: 1,
            country: 1,
            location: 1,
            login: 1,
            name: 1,
            profile: 1,
            requisitionId: 1,
            state: 1,
            updated: 1,
            _id: 1
          }
        },
        {
          '$sort': {
            requisitionId: 1,
            state: -1,
            updated: -1
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
}
