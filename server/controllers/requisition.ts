import Requisition from '../models/requisition';
import Candidate from '../models/candidate';
import BaseCtrl from './base';

export default class RequisitionCtrl extends BaseCtrl {
  model = Requisition;

  // Get all
  getAll = (req, res) => {
    let query = this.reduceQuery(req.query);
    console.log('Finding all', query);
    this.model
      .find(query)
      .sort({requisitionId: 1})
      .exec((err, docs) => {
        if (err) { return console.error(err); }
        res.json(docs);
      });
  }
}
