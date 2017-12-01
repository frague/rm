import Diff from '../models/diff';
import BaseCtrl from './base';

export default class SnapshotCtrl extends BaseCtrl {
  model = Diff;

  getAll = (req, res) => {
    let query = this.reduceQuery(req.query);
    console.log('Finding all', query);
    this.model.find(query).sort({date: 1}).exec((err, docs) => {
      if (err) {
        return console.error(err);
      }
      res.json(docs);
    });
  }
}
