import Candidate from '../models/candidate';
import BaseCtrl from './base';

export default class CandidateCtrl extends BaseCtrl {
  model = Candidate;

  // Get all
  // getAll = (req, res) => {
  //   let query = this.reduceQuery(req.query);
  //   console.log('Finding all', query);
  //   this.model
  //     .find(query)
  //     .sort({date: -1})
  //     .exec((err, docs) => {
  //       if (err) { return console.error(err); }
  //       res.json(docs);
  //     });
  // }

  getAll = (req, res) => {
    let docs = [];
    for (let i = 0; i < 10; i++) {
      docs.push(new Candidate({
        login: '-flastname' + i,
        name: 'FirstName LastName' + i,
        country: 'RU',
        location: 'SPB',
        profile: 'Developer',
        specialization: 'UI',
        requisitionId: i < 5 ? 'GD0001' : 'GD0002'
      }));
    }
    res.json(docs);
  }
}
