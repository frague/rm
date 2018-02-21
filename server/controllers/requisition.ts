import Requisition from '../models/requisition';
import Candidate from '../models/candidate';
import BaseCtrl from './base';

export default class RequisitionCtrl extends BaseCtrl {
  model = Requisition;

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

  generateCandidates(id = '') {
    let docs = [];
    for (let i = 0, l = Math.round(10 * Math.random()); i < l; i++) {
      docs.push(new Candidate({
        name: 'FirstName LastName' + i,
        requisitionId: id,
      }));
    }
    return docs;
  }

  getAll = (req, res) => {
    let docs = [];
    for (let i = 0; i < 10; i++) {
      let id = 'GD00' + i;
      docs.push({
        position: id,
        title: 'Developer',
        jobType: '',
        category: 'UI Developer',
        source: 'external',
        department: 'GD',
        account: 'CTO',
        project: 'Bench',
        profile: 'UI Developer',
        specialization: 'Angular',
        grade1: 'T1',
        grade2: 'T2',
        city: 'Kharkov',
        location: 'Ukraine',
        billability: 'billable',
        start: '2018-03-01',
        end: null,
        candidates: this.generateCandidates(id)
      });
    }
    res.json(docs);
  }
}
