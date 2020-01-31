import Requisition from '../models/requisition';
import Candidate from '../models/candidate';
import Comment from '../models/comment';
import BaseCtrl from './base';
import { printTitle } from '../utils';

export default class CandidateCtrl extends BaseCtrl {
  model = Candidate;
  limit = 1000;

  baseCommentsModifiers = {
    include: ['candidate'],
    'candidate': (key, value) => {
      if (key.includes('candidate.comments')) {
        key = key.replace('candidate.comments.', '');
        return {'source': key};
      }
    },
  };

  initialCommentsModifiers = {
    include: ['candidate'],
    'candidate': (key, value) => {
      if (key.includes('candidate.comments')) {
        key = key.replace('candidate.comments.', '');
        return {'commentsTemp.source': key};
      }
    },
  };

  finalCommentsModifiers = {
    include: ['candidate'],
    'candidate': (key, value) => {
      if (key.includes('candidate.comments')) {
        key = key.replace('candidate.', '');
        return {[key]: value};
      }
    },
  };

  candidatesModifiers = {
    include: ['candidate'],
    candidate: (key, value) => {
      if (!key.includes('.comments')) {
        key = key.replace('candidate.', '');
        return {[key]: value};
      }
    },
  };

  // Get all
  getAll = (req, res) => {
    printTitle('Candidates');

    let or;
    try {
      or = req.query.or ? JSON.parse(req.query.or) : [];
    } catch (e) {
      console.error('Error parsing search query: ' + req.query.or);
      return res.sendStatus(500);
    }

    let candidatesQuery = this.fixOr(this.modifyCriteria(or, this.candidatesModifiers));
    let initialCommentsQuery = this.fixOr(this.modifyCriteria(or, this.initialCommentsModifiers));
    let finalCommentsQuery = this.fixOr(this.modifyCriteria(or, this.finalCommentsModifiers));
    let baseCommentsQuery = this.fixOr(this.modifyCriteria(or, this.baseCommentsModifiers));

    this.limit = Object.keys(finalCommentsQuery).length ? 1000 : 100;

    console.log('Initial:', JSON.stringify(or));
    console.log('Candidates query:', JSON.stringify(candidatesQuery));
    console.log('Comments base query:', JSON.stringify(baseCommentsQuery));
    console.log('Comments initial query:', JSON.stringify(initialCommentsQuery));
    console.log('Comments final query:', JSON.stringify(finalCommentsQuery));

    if (Object.keys(candidatesQuery).length > 0) {
      // Candidates criteria provided
      console.log('Primary filtering by candidates:');
      return this.model
        .aggregate([
          {
            '$match': candidatesQuery
          },
          {
            '$lookup': {
              from: 'comments',
              localField: 'login',
              foreignField: 'login',
              as: 'commentsTemp'
            }
          },
          {
            '$match': initialCommentsQuery
          },
          {
            '$addFields': {
              commentsCount: {'$size': '$commentsTemp'},
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
              },
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
            '$match': finalCommentsQuery
          },
          {
            '$project': {
              applicationId: 1,
              city: 1,
              comments: '$commentsTemp',
              commentsCount: 1,
              country: 1,
              location: 1,
              login: 1,
              name: 1,
              profile: 1,
              requisitionId: 1,
              state: 1,
              updated: 1,
              status: 1,
              _id: 1
            }
          },
          {
            '$sort': {
              updated: -1,
              state: -1,
            }
          }
        ]
      )
      .then(data => {
        console.log(`${data && data.length} records matched`);
        return res.json(data);
      })
      .catch(error => {
        console.log('Error', error);
        res.sendStatus(500);
      });
    } else if (Object.keys(baseCommentsQuery).length > 0) {
      // Comments criteria provided
      console.log('Primary filtering by comments:');
      return Comment
        .aggregate([
          {
            '$match': baseCommentsQuery
          },
          {
            '$lookup': {
              from: 'candidates',
              localField: 'login',
              foreignField: 'login',
              as: 'candidate'
            }
          },
          {
            '$unwind': {
              path: '$candidate',
              preserveNullAndEmptyArrays: false
            }
          },
          {
            '$group': {
              _id: '$login',
              commentsTemp: {
                '$push': {
                  source: '$source',
                  text: '$text',
                  isStatus: '$isStatus',
                  date: '$date',
                  login: '$login'
                }
              },
              login: {'$first': '$candidate.login'},
              name: {'$first': '$candidate.name'},
              country: {'$first': '$candidate.country'},
              city: {'$first': '$candidate.city'},
              location: {'$first': '$candidate.location'},
              profile: {'$first': '$candidate.profile'},
              state: {'$first': '$candidate.state'},
              updated: {'$first': '$candidate.updated'},
              requisitionId: {'$first': '$candidate.requisitionId'},
              applicationId: {'$first': '$candidate.applicationId'},
            }
          },
          {
            '$match': candidatesQuery
          },
          {
            '$addFields': {
              commentsCount: {'$size': '$commentsTemp'},
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
              },
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
            '$match': finalCommentsQuery
          },
          {
            '$project': {
              applicationId: 1,
              city: 1,
              comments: '$commentsTemp',
              commentsCount: 1,
              country: 1,
              location: 1,
              login: 1,
              name: 1,
              profile: 1,
              requisitionId: 1,
              state: 1,
              updated: 1,
              status: 1,
              _id: 1
            }
          },
          {
            '$sort': {
              updated: -1,
              state: -1,
            }
          }
        ]
      )
      .then(data => {
        console.log(`Records matched: ${data && data.length}`);
        return res.json(data);
      })
      .catch(error => {
        console.log('Error', error);
        res.sendStatus(500);
      });
    } else {
      // Return empty set
      return res.json([]);
    }
  }
}
