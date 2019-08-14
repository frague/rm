import Badge from '../models/badge';
import BaseCtrl from './base';

export default class BadgeCtrl extends BaseCtrl {
  model = Badge;

  modifiers = {
  };

  cleanup = (req, res) => {
    this.model.deleteMany({}, (err) => {
      if (err) { return console.error(err); }
      res.sendStatus(200);
    })
  }

  getAll = (req, res) => {
    let or;
    try {
      or = req.query.or ? JSON.parse(req.query.or) : [];
    } catch (e) {
      console.error('Error parsing search query: ' + req.query.or);
      return res.sendStatus(500);
    }

    let query = this.fixOr(this.modifyCriteria(or, this.modifiers));

    console.log('- Badge ----------------------------------------------------------');
    console.log('Initial:', JSON.stringify(or));
    console.log('Query:', JSON.stringify(query));

    this.model.find(query).sort({date: -1, subject: 1}).limit(100).exec((err, docs) => {
      if (err) {
        console.error(err);
        return res.sendStatus(500);
      }
      res.json(docs);
    });
  }

}
