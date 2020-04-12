import Requisition from '../models/requisition';
import Candidate from '../models/candidate';
import Comment from '../models/comment';
import BaseCtrl from './base';
import { printTitle } from '../utils';

export default class CandidateCtrl extends BaseCtrl {
  model = Candidate;
  limit = 1000;

  baseModifiers = {
    include: ['candidate', 'login'],
    candidate: (key, value) => {
      if (!key.includes('.comments')) {
        key = key.replace('candidate.', '');
        return {[key]: value};
      }
    },
  };

  finalModifiers = {
    include: ['candidate'],
    'candidate': (key, value) => {
      key = key.replace('candidate.', '');
      return {[key]: value};
    },
  };

  // Get all
  getAll = async (req, res) => {
    printTitle('Candidates');

    let or;
    try {
      or = req.query.or ? JSON.parse(req.query.or) : [];
    } catch (e) {
      console.error('Error parsing search query: ' + req.query.or);
      return res.sendStatus(500);
    }

    or = await this.updateOr(or, 'candidate');

    let baseQuery = this.fixOr(this.modifyCriteria(or, this.baseModifiers));
    let finalQuery = this.fixOr(this.modifyCriteria(or, this.finalModifiers));

    this.limit = Object.keys(finalQuery).length ? 1000 : 100;

    console.log('Initial:', JSON.stringify(or));
    console.log('Base query:', JSON.stringify(baseQuery));
    console.log('Final query:', JSON.stringify(finalQuery));

    return this.model
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
      })
      .match(finalQuery)
      .project({
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
        status: 1,
        _id: 1
      })
      .sort({
        updated: -1,
        state: -1,
      })
      .exec()
      .then(data => {
        console.log(`Demand: ${data && data.length} records matched`);
        return res.json(data);
      })
      .catch(error => {
        console.log('Error', error);
        res.sendStatus(500);
      });
    }
}
