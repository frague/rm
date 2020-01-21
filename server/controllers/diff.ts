import Diff from '../models/diff';
import BaseCtrl from './base';

export default class DiffCtrl extends BaseCtrl {
  model = Diff;

  getAll = (req, res) => {
    let query = this.reduceQuery(req.query);
    console.log('Finding all', query);
    this.model.find(query).sort({date: -1, subject: 1}).limit(100).exec((err, docs) => {
      if (err) {§
        console.error(err);
        return res.sendStatus(500);
      }
      res.json(docs);
    });
  }

  getLastUpdate = (req, res) => {
    this.model.findOne().sort({date: -1}).exec((err, doc) => {
      if (err) {§
        console.error(err);
        return res.sendStatus(500);
      }
      res.json(doc.date);
    });
  }
}
