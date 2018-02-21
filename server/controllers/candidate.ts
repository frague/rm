import Candidate from '../models/candidate';
import BaseCtrl from './base';

export default class CandidateCtrl extends BaseCtrl {
  model = Candidate;

  // Get all
  getAll = (req, res) => {
    let query = this.reduceQuery(req.query);
    console.log('Finding all', query);
    this.model
      .find(query)
      .sort({date: -1})
      .exec((err, docs) => {
        if (err) { return console.error(err); }
        res.json(docs);
      });
  }
}
