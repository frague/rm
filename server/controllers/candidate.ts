import Candidate from '../models/candidate';
import BaseCtrl from './base';

export default class CandidateCtrl extends BaseCtrl {
  model = Candidate;

  candidateTransform = (key, value) => {
    key = key.replace('candidate.', '');
    return {[key]: value};
  }

  // Get all
  getAll = (req, res) => {
    let or;
    let query = {};
    let commentsQuery = {};

    console.log(req.query);

    try {
      or = req.query.or ? JSON.parse(req.query.or) : [];
    } catch (e) {
      console.error('Error parsing search query: ' + req.query.or);
      return res.status(500);
    }

    query = this.filterCriteria(or, new RegExp(/^candidate\./), this.orKey, this.candidateTransform) || {};
    commentsQuery = this.filterCriteria(or, new RegExp(/^comments/), this.orKey, this.commentTransform) || {};

    console.log('- Candidates ------------------------------------------------------');
    console.log('Initial:', JSON.stringify(or));
    console.log('Query:', JSON.stringify(query));
    console.log('Comments:', JSON.stringify(commentsQuery));

    console.log('Finding all', query);
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
        '$match': commentsQuery
      },
      // {
      //   '$project': {
      //     account: 1,
      //     pool: 1,
      //     acknowledgement: 1,
      //     role: 1,
      //     profile: 1,
      //     start: 1,
      //     end: 1,
      //     deployment: 1,
      //     stage: 1,
      //     grades: 1,
      //     locations: 1,
      //     requestId: 1,
      //     comment: 1,
      //     login: 1,
      //     commentsCount: 1,
      //     status: 1
      //   }
      // },
      {
        '$match': query
      },
      {
        '$sort': {
          requisitionId: 1,
          updated: -1
        }
      }
    ], (err, docs) => {
      if (err) { return console.error(err); }
      res.json(docs);
    });
  }

  // getAll = (req, res) => {
  //   let docs = [];
  //   for (let i = 0; i < 10; i++) {
  //     docs.push(new Candidate({
  //       login: '-flastname' + i,
  //       name: 'FirstName LastName' + i,
  //       country: 'RU',
  //       location: 'SPB',
  //       profile: 'Developer',
  //       specialization: 'UI',
  //       requisitionId: i < 5 ? 'GD0001' : 'GD0002'
  //     }));
  //   }
  //   res.json(docs);
  // }
}
